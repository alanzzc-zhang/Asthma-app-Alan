import style from './ExploreData.module.css';
import React, {useState, useEffect, useMemo, useCallback, memo} from 'react';
import TimeSelection from './TimeSelection';
import {
    ResponsiveContainer,
    LineChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceDot,
    ReferenceArea,
    Scatter,
    Line,
    ComposedChart,
    Rectangle,
    Customized
} from 'recharts'
import Data_NoteEditor from './Data_NoteEditor';
import {Link} from 'react-router-dom'
import SummaryModal from './SummaryModal';
import HistorySummary from './HistorySummary';
function Explore_data(){
    //filter functionality
    const [filters, setFilter] = useState({
        act: true,//default filter
        pollen: true,//default filter
        breathlessness: false,
        coughFeq: false,
        med: false,
        notes: false,
        cougEvent: false
    })
    //detection for section visualization
    const section1Visible = filters.act || filters.pollen//section 1: ACT + pollen
    const section2Visible = filters.breathlessness || filters.coughFeq//section 2: Breathlessness + CoughFrequency(additional Cough event)
    const section3Visible = filters.notes || filters.med//section 3: User's notes and medication usage
    const visibleSections = [section1Visible, section2Visible, section3Visible].filter(Boolean).length//return a number(0-3),use to organize section area
    //to get Time scale that user selected
    const[fromDate, setFromDate] = useState(() => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday;
    })
    const[toDate, setToDate] = useState(() => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday;
    })
    //function to convert fromDate and toDate to a array list
    function generateDateRange(fromDate, toDate){
        const dates = []//will be used to store final output

        //get the value, also avoid the issue that make change in original varible
        let current = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
        const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());

        while(current <= end){
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, '0');
            const day = String(current.getDate()).padStart(2, '0');
            dates.push(`hourlySummary_${year}_${month}_${day}.json`);//store into array

            //update current
            current.setDate(current.getDate() + 1);
        }

        return dates;//will return a array of date between "fromDate" and "toDate" inclusive
    }
    //only triggered when user click "confirm" with a valid value
    const [hourlyData , setHourlyData] = useState([])//use to store the data from json file
    useEffect(() =>{
        //I want to use "await" here, so I create a async function
        async function fetchAll(){
            if(fromDate > toDate){//testing purpose
                console.warn("Invalid")
                return;
            }
            //will get a list of file name with date
            const filesToFetch = generateDateRange(fromDate, toDate);
            //test purpose
            console.log("Need to fetch files:", filesToFetch);
    
            //store all data 
            const promises = filesToFetch.map(
                fileName => 
                    fetch(`/data/${fileName}`)
                    .then(response => {
                        if(!response.ok){
                            throw new Error(`Failed to load ${fileName}`);
                        }
                        return response.json()
                    })
                    .catch(err =>{
                        console.error(err);
                        return [];
                    })
                )
            const AfterPromises = await Promise.all(promises);
            const merged = AfterPromises.flat();//flatten all 24-hour arrays into one big array
            //extra operation if we need visual section2(filter => true)
            //if(section2Visible){
                merged.forEach(item => {//for each hour
                    item.breathlessness_serverity = EstBreathlessnessServerity(item);
                    item.cough_total = item.cough_count ?? 0;
                    item.cough_event = EstCoughEvent(item);
                })
            //}
            setHourlyData(merged)//store it
            //test purpose
            //console.log("Loaded: ", merged);
        }

        fetchAll();

    },[fromDate, toDate])
    //reGroup some varible for further data visualization
    //if Time scale <= 2 days: use per hour as ticks, if 3-14 days, use per day as ticks, if > 14 days, use per serveral day/week as tick
    const [pollenChartData, setPollenChartData] = useState([]);
    useEffect(() =>{
        const groupedData = {}
        const isShortRange = (toDate - fromDate) / (1000 * 60 * 60 * 24) <= 2;
        if(isShortRange){
            //don't change, use hour as ticks
            hourlyData.forEach(item => {
                const hourkey = item.hour.slice(0, 13);//eg: 2025-06-01T20:00:00 -> 2025-06-01T20
                const date = new Date(item.hour).toLocaleString('en-CA', {
                    hour: '2-digit',
                    hour12: false,
                    day: '2-digit',
                    month: '2-digit'
                });

                //this part for section 3
                const medStatus = item.medication_status || [];
                const totalMed = medStatus.length;
                const onTimeMed = medStatus.filter(m => m.on_time).length;
                const medRatio = totalMed > 0 ? onTimeMed / totalMed : null;//calculate medication adherence rate
                
                //package data for visualization
                groupedData[date] = {
                    date: date,
                    avgPollen: item.pollen,
                    act: item.last_act_score ?? null,
                    breath: item.breathlessness_serverity ?? null,
                    cough_total: -1*item.cough_total ?? null,
                    cough_event: item.cough_event.map(event => ({
                        ...event,
                        time: date
                    }))?? [],
                    medRatio: medRatio,
                    medication: medStatus, //store the orginal information
                    note: item.notes?.length > 0 ?[{
                        period: getPeriodLabel(item.hour.split('T')[1]),
                        note: item.notes
                    }] : []
                };
            });
            
        }else{
            const dailyPollen = {};
            const dailyACT ={};
            const dailyBreath = {};
            const dailyCough ={};
            const dailyCoughEvent = {};
            const dailyMed = {};
            const dailyNote = {};
            //collect data based on date only
            hourlyData.forEach(item => {
                const dataKey = item.hour.split('T')[0]//eg: 2025-06-01T20:00:00 -> 2025-06-01
                const hour = item.hour.split('T')[1]
                
                //group pollen 
                if(!dailyPollen[dataKey]) dailyPollen[dataKey] = []// initialize
                dailyPollen[dataKey].push(item.pollen);
                //group act
                if(item.last_act_score !== undefined){
                    dailyACT[dataKey] = item.last_act_score;
                }
                //group serverity level
                if(item.breathlessness_serverity !== undefined){
                    dailyBreath[dataKey] = item.breathlessness_serverity;
                }
                //group cough frequency
                if (!dailyCough[dataKey]) dailyCough[dataKey] = 0;// initialize
                if(item.cough_total !== undefined){
                    dailyCough[dataKey] += item.cough_total
                }
                //Gruop cough event
                if(!dailyCoughEvent[dataKey]) dailyCoughEvent[dataKey] = [];// initialize
                if(Array.isArray(item.cough_event)){
                    const EventsPlusDate = item.cough_event.map(e => ({
                        ...e,
                        time: hour
                    }))
                    dailyCoughEvent[dataKey].push(...EventsPlusDate);
                }
                const Label = getPeriodLabel(hour);
                //Group medication status (also with raw data for hover)
                const medList = item.medication_status || [];
                if(!dailyMed[dataKey]) dailyMed[dataKey] = []//initialize
                if(medList.length > 0){
                    

                    dailyMed[dataKey].push({
                        period: Label,
                        medications: medList.map(m => ({
                            ...m,
                            hour: item.hour//include original info for tooltip
                        }))
                    })
                }
                //Group User's notes
                const NoteList = item.notes || [];
                if(!dailyNote[dataKey]) dailyNote[dataKey] = [];//initialize
                if(NoteList.length > 0){
                    dailyNote[dataKey].push({
                        period: Label,
                        notes: NoteList.map(m => ({
                            ...m,
                            hour: item.hour//include original info
                        }))
                    })
                }
            });
            //package them as "per day" level
            Object.keys(dailyPollen).forEach(day =>{
                const avg = dailyPollen[day].reduce((a, b) => a + b, 0)/dailyPollen[day].length//calculate average pollen level per day
                const date = day.slice(5);//we don't need "hour" because the time scale is "per day"

                //calculate medication adherence rate for section 3
                const medEntries = dailyMed[day] ?? [];
                const total = medEntries.flatMap(m => m.medications).length;//total medication
                const onTime = medEntries.flatMap(m => m.medications).filter(e => e.on_time).length;//how many of them is on time
                const medRatio = total > 0 ? onTime / total : null;

                groupedData[date] = {
                    date: date,
                    avgPollen: Number(avg.toFixed(2)),
                    act: dailyACT[day] ?? null,//a score or null
                    breath: dailyBreath[day] ?? 1,
                    cough_total: -1 * (Number((dailyCough[day]/24).toFixed(2)) ?? 0), //unit: per hour
                    cough_event: dailyCoughEvent[day] ?? [],
                    medRatio: medRatio,
                    medication: medEntries,
                    note: dailyNote[day] ?? null
                }
            })
        }

        const final = Object.values(groupedData).map((item, index) => ({
            ...item,
            x: index
        }));
        //test purpose
        console.log("Grouped data: ", final);
        setPollenChartData(final);
    },[hourlyData, fromDate, toDate]);
    //construct breathlessness serverity level RectData
    //prevent multiple re-rendering if the value not change
    const breathRectData = useMemo(() => {
        if(!section2Visible || pollenChartData.length < 2) return [];
        //pick a color based on the serverity level from 1-10
        const colorMapping = [
            "#edf7f6", "#d0ece7", "#b2dfdb", "#80cbc4", "#4db6ac",
            "#26a69a", "#009688", "#00897b", "#00796b", "#004d40"
        ];

        //for each block(or say color rectangle) assigning needed information for visualizing
        const block =[];
        for(let i = 0; i < pollenChartData.length - 1; i++){
            const Curr = pollenChartData[i];//get first object
            const Next = pollenChartData[i + 1]//get the next object too
            const serverity = Curr.breath ?? 1;//get serverity level
            const color = colorMapping[Math.max(0, Math.min(serverity - 1, 9))]//level: 1-10, index of array: 0-9

            block.push({
                x1: i,
                x2: i + 1,
                fill: color,
                severity: serverity,//use for hover
                hour: Curr.date//use for hover
            })
        }
        return block
    },[pollenChartData, section2Visible])
    //for "daily", "weekly" and "monthly" buttoms
    const [timeClassName, setTimeClass] = useState(null)//use to highlight buttom that user click
    const setDateRange = (type) =>{
        setTimeClass(type);

        const now = new Date();//today
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);//yesterday(also is "toDate")

        let startDate = new Date(yesterday)//use to update "fromDate"

        if(type === "weekly"){
            startDate.setDate(yesterday.getDate() - 6);//include yesterday, totally 7 days
        }else if(type === "monthly"){
            startDate.setDate(yesterday.getDate() - 29);//totally 30 days
        }

        //update
        setFromDate(startDate);
        setToDate(yesterday);
    }
    //for left/right arrow in time scale bar
    function shiftDatesByRange(direction){
        const multiplier = direction === 'left' ? -1 : 1;//get the direction
        const timeDiff = toDate.getTime() - fromDate.getTime();//calculate the gap(how many days within this range)
        const dayDiff = Math.round(timeDiff / (1000 * 60 * 60 *24)) + 1//inclusive, get how many days we need to shift
        //a function to shift days
        const shiftDate = (date, days) =>{
            const newDate = new Date(date);
            newDate.setDate(newDate.getDate() + days)
            return newDate;
        }
        //update(include direction)
        setFromDate(p => shiftDate(p, multiplier * dayDiff));
        setToDate(p => shiftDate(p, multiplier * dayDiff))
    }
    // for right arrow to detect whether can continue go to the right
    const canShiftRight = (() =>{
        const today = new Date();
        today.setHours(0, 0, 0, 0)//normalized to midnight

        const timeDiff = toDate.getTime() - fromDate.getTime();//calculate the gap(how many days within this range)
        const daysDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24))+ 1

        const projectToDate = new Date(toDate);
        projectToDate.setDate(projectToDate.getDate() + daysDiff)//go to right

        return projectToDate <= today//if it's bigger than "today", means we can't go to right anymore
    })
    //pollen data visualization dot color
    const getDotColor = (value) =>{
        if(value > 7) return 'red';
        if(value > 3.5) return 'yellow';
        return 'green'
    };
    //Estimation of Severity level(future work: use llm)
    function EstBreathlessnessServerity(summary){
        let score = 1;

        //pollen level
        if(summary.pollen > 8) score += 3;
        else if(summary.pollen > 5.5) score += 2;
        else if(summary.pollen > 3) score += 1;
        else score -= 1;
        //PM2.5
        if(summary.pm25 > 100) score += 3;
        else if(summary.pm25 > 40) score += 2;
        //PM10
        if(summary.pm10 > 100) score += 3;
        else if(summary.pm10 > 60) score += 2;
        //Notes: health score
        const poorHealthScore = summary.notes.filter(n => n.health_score < 60).length;
        if(poorHealthScore === 1) score += 1;
        else if(poorHealthScore === 2) score += 2;
        else if(poorHealthScore >= 3) score += 3;
        else score -= 1;
        //Medication: on time or not
        const delayedMeds = summary.medication_status.filter(m => !m.on_time).length;
        score += delayedMeds;
        //Reliever: Number of Use
        score += summary.reliever_total;
        return Math.min(10, Math.max(1, score));
    }
    //Estimation of Cough Event(future work: use llm)
    function EstCoughEvent(summary){
        const dt = new Date(summary.hour);
        const hour = dt.getHours();
        const events = []
        //Rule 1: Night time cough
        if(hour >= 0 && hour <= 6 && summary.cough_count > 5){
            events.push({type: "Night Cough"})
        }
        else if(summary.cough_count > 8){//Rule 2: Severe cough
            events.push({type: "Severe Cough"});
        }
        //Rule 3: Used reliever
        if(summary.reliever_total > 0){
            events.push({type: "Used Inhaler"});
        }

        // Rule 4: Delayed med + cough
        summary.medication_status?.forEach(m => {
            if (!m.on_time && summary.cough_count > 3) {
                events.push({ type: "Cough Before Delayed Med" });
            }
        });
        return events;
    }
    //Breathlessness_level hover function
    const [hoveredBlockIndex, setHoveredBlockIndex] = useState(null);
    const [blockTooptipPos, setBlockToolTipPos] = useState({//position of the hover
        x: 0,
        y: 0,
        content: ""
    })
    //Cough Event visualization
    const [hoveredPinIndex, setHoveredPinIndex] = useState(null);
    const PushpinShape = ({cx, cy, payload, onHover, onLeave}) =>{
        //if cough_event is not null or undefined  OR if it is [] empty array
        if(!payload.cough_event || payload.cough_event.length === 0) return null;

        const content = payload.cough_event.map((n, i) => `Note ${i + 1}: Type: ${n.type}. Time: ${n.time}`).join('\n');
        return(
        <text
            x = {cx}
            y = {cy}
            dy={2}
            dx={4}
            textAnchor='start'
            fontSize={16}
            style={{cursor: 'pointer',pointerEvents: 'auto'}}
            onMouseEnter={() => onHover({x : cx, y: cy, content})}
            onMouseLeave={() => onLeave()}
        >
            📌
        </text>
        )
    }
    //simple pushpin hover detection
    const tooltipWidth = 180; // approximate tooltip width
    const chartWidth = 800; // actual chart width(use ref if needed)

    //function to get period label for section 3
    function getPeriodLabel(hourS){
        const hourNumber = parseInt(hourS.split(':')[0]);
        if(hourNumber < 8) return'00:00-08:00';
        else if (hourNumber < 14) return'09:00-14:00';
        else if (hourNumber < 20) return '15:00-20:00';
        else return '21:00-24:00';
    }
    //function to help visualize section 3
    const timePeriods = ['','00:00-08:00', '09:00-14:00', '15:00-20:00','21:00-24:00']//include a dummy value
    const [hoverInfo, setHoverInfo] = useState(null);//for hover function
    const [tooltipLocked, setToolTipLocked] = useState(null)
    
    function getMedColor(ratio){
        if(ratio === null) return '#ffffff';//pure white
        if(ratio === 0) return '#e0f0ff';
        if(ratio <= 0.25) return '#b3d1f7';
        if(ratio <= 0.5) return '#82b3ef';
        if(ratio <= 0.75) return '#4a94e6';
        return '#0066cc';
    }

    //for button "Edit notes/data". note I didn't integrate LLM yet
    const [showModal, setShowModal] = useState(false);

    //for button "Summary"
    const [showSummaryModal, setShowSummaryModal] = useState(false);

    //for button "Review History Report", note I didn't integrate LLM yet
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    
    //console.log("breathRectData:", breathRectData);
    //console.log("Data: ",pollenChartData.slice(0,3));
    //console.log("Visible: ", visibleSections);
    /*console.log(
        "Type check:",
        typeof pollenChartData[0]?.cough_total,
        pollenChartData[0]?.cough_total
    );*/
    

    return(
        <div className={style.ExploreBody}>
            {/* Page Title */}
            <h1 className={style.PageTitle}>Explore Your data</h1>

            {/* Control strip for time scale */}
            <div className={style.TimeScaleBar}>
                <div className={style.LeftGroup}>
                    <button className={style.ArrowBtn} onClick={() => shiftDatesByRange('left')}>←</button>
                    
                    <p>From: </p>
                    <TimeSelection
                        label="From"
                        selectedDate={fromDate}
                        OnChange={(newDate) => {
                            setFromDate(newDate)
                            setTimeClass(null)
                        }}
                        compareDate = {toDate}
                        isFrom={true}
                    />
                    <p>To: </p>
                    <TimeSelection
                        label="To"
                        selectedDate={toDate}
                        OnChange={(newDate) => {
                            setToDate(newDate)
                            setTimeClass(null)
                        }}
                        compareDate={fromDate}
                        isFrom={false}
                    />
                    
                </div>
                {/* buttom to quickly select 'yesterday', 'last week'(include yesterday), or 'last month'*/}
                <div className={style.CenterGroup}>
                    <button onClick={() => setDateRange("daily")} className={timeClassName == "daily" ? style.SelectedBtn : ""}>Daily</button>
                    <button onClick={() => setDateRange("weekly")} className={timeClassName === "weekly" ? style.SelectedBtn : ""}>Weekly</button>
                    <button onClick={() => setDateRange("monthly")} className={timeClassName === "monthly" ? style.SelectedBtn : ""}>Monthly</button>
                </div>

                <div className={style.RightGroup}>
                    <button 
                        className={`${style.ArrowBtn} ${!canShiftRight() ? style.Disabled : ''}`} 
                        onClick={() => canShiftRight && shiftDatesByRange('right')}
                        disabled = {!canShiftRight()}>→</button>
                </div>
                
            </div>

            {/* Main Grid: Main Part + Filter + SideBar */}
            <div className={style.ExploreGrid}>
                <div className={style.MainGraph}>
                    {/* Section 1: ACT + Pollen */}
                    {section1Visible && (
                        <div className={style.Section} style={{height: `${100 / visibleSections}%`}}>
                            <ResponsiveContainer width= "100%" height= "100%">
                                <LineChart data={pollenChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    
                                    <XAxis 
                                        dataKey="date"
                                        tickFormatter={(value, index) => {
                                            const total = pollenChartData.length;
                                            if(total > 14 && index % 2 !== 0) return '';
                                            // 2. detecting is "07-06, 00" or "07-06"
                                            if (value.includes(',')) {
                                                // short time mode, split it
                                                const parts = value.split(', ');
                                                return parts[1]; // e.g., "00", "02", etc.
                                            }
                                            return value
                                        }}/>
                                    <YAxis 
                                        yAxisId= "PollenNum"
                                        type= "number"
                                        hide = {!filters.pollen}
                                        domain={[0, 10]}
                                        ticks={[1.75, 5.5, 8.75]}
                                        tickFormatter={(value) => {
                                            if (value < 3.5) return 'Low';
                                            if (value < 7.5) return 'Moderate';
                                            return 'High';
                                        }}
                                        label={{
                                            value: 'Pollen (level)',
                                            angle: -90,
                                            position: 'outsideLeft'
                                        }}
                                    />
                                    <YAxis 
                                        yAxisId="ACT"
                                        type="number"
                                        hide ={!filters.act}
                                        domain={[0, 25]}
                                        orientation={filters.pollen ? "right" : "left"}
                                        label={{
                                            value: 'ACT (score)',
                                            angle: (filters.pollen ? 90 : -90),
                                            position: 'outsideLeft'
                                        }}
                                    />
                                    <Tooltip />
                                    {filters.pollen && (
                                        <Line 
                                            yAxisId= "PollenNum"
                                            type= "monotone" 
                                            dataKey="avgPollen" 
                                            name="Pollen" 
                                            stroke="#82ca9d" 
                                            dot={({ cx, cy, value }) =>(
                                                <circle
                                                    cx = {cx}
                                                    cy = {cy}
                                                    r = {5}
                                                    fill={getDotColor(value)}
                                                    stroke="white"
                                                    strokeWidth={1}/>
                                            )}
                                        />
                                    )}
                                    {filters.act && (
                                        <Line 
                                            yAxisId="ACT"
                                            type= "monetone"
                                            dataKey= "act"
                                            name= "ACT Score"
                                            stroke= "#8884d8"
                                            dot = {{r: 5, fill: '#8884d8'}}
                                        />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    {/* Section 2: Breathlessness serverity level + Cough Frequency(with cough event) */}
                    {section2Visible && (
                        <div className={style.Section} style={{height: `${100 / visibleSections}%`}}>
                            <ResponsiveContainer width="100%" height="100%">
                            {/*console.log("Chart data passed:", pollenChartData.slice(0, 3))*/}
                                <ComposedChart  data={pollenChartData}>
                                    {/* invisible if section 1 is visible */}
                                    {/*console.log("filters.breathlessness:", filters.breathlessness)*/}
                                    {/*console.log("breathRectData:", breathRectData)*/}
                                    <XAxis 
                                        dataKey= "x"
                                        type="number"
                                        hide={section1Visible}
                                        domain={[Math.min(...pollenChartData.map(d => d.x)), Math.max(...pollenChartData.map(d => d.x))]}
                                        tickFormatter={(value) => pollenChartData[value]?.date || ''}
                                        ticks = {pollenChartData.map(d => d.x)}
                                    />
                                    <YAxis
                                        type='number'
                                        hide ={false}
                                        domain={['dataMin - 1', '0']}
                                        tickFormatter={(val) => Math.abs(val)}
                                        orientation='right'
                                    />
                                    {/* color block for visualizing breathlessness level */}
                                    {filters.breathlessness && breathRectData.map((block ,index) =>{
                                        return(<ReferenceArea 
                                            key={`ref-${index}`}
                                            x1={block.x1}
                                            x2={block.x2}
                                            y1 = {0}
                                            y2 = {-0.9}
                                            stroke='none'
                                            fill={block.fill}
                                            fillOpacity={1}
                                            ifOverflow='extendDomain'
                                        />);
                                    })}
                                    {filters.breathlessness && breathRectData.map((block, index) => {
                                        return(
                                            <rect
                                                key={`hover-${index}`}
                                                x={index * 25}
                                                y={0}
                                                width={100}
                                                height={100}
                                                fill="transparent"
                                                onMouseEnter={() => {
                                                    setHoveredBlockIndex(index)
                                                    const sev = block.severity;
                                                    const severityObj = typeof sev === "object"
                                                        ? sev
                                                        : {level: sev, reason: "Unknown", confidence: "Unknown"}
                                                    let date = "??";

                                                    if (typeof block.hour === "string") {
                                                        const parts = block.hour.split(', ');
                                                        const isShortRange = (toDate - fromDate) / (1000 * 60 * 60 * 24) <= 2;

                                                        if (isShortRange) {
                                                            // 只显示小时部分，例如 "00"
                                                            date = parts[1] ?? "??:??";
                                                            date = `${date}:00`; // 加上 ":00" 显示完整时间
                                                        } else {
                                                            // 只显示日期部分，例如 "07/05"
                                                            date = parts[0]?.replace('-', '/') ?? "??/??";
                                                        }
                                                    }

                                                    setBlockToolTipPos({
                                                        x: index*25,
                                                        y: 0,
                                                        content:`Date: ${date}\n- Level: ${severityObj.level}\n- Reason: ${severityObj.reason}\n- Confidence: ${severityObj.confidence}`,
                                                    })
                                                }}
                                                onMouseLeave={() => setHoveredBlockIndex(null)}
                                                style={{pointerEvents: "auto", cursor: "pointer"}}
                                            />
                                        );
                                    })}
                                    {/* Invisible dummy line to trigger update */}
                                    {filters.breathlessness && (
                                        <Line
                                            dataKey={() => 0} // constant zero line
                                            stroke="transparent"
                                            isAnimationActive={false}
                                        />
                                    )}
                                    {filters.coughFeq && (
                                        pollenChartData.map((item, index) => (
                                            <Line 
                                                key={index}
                                                type="linear"
                                                data={[
                                                    {x: item.x, cough_total: 0},
                                                    {x: item.x, cough_total: item.cough_total}
                                                ]}
                                                dataKey="cough_total"
                                                stroke='#8884d8'
                                                dot ={false}
                                                strokeWidth={3}/>
                                        ))
                                    )}
                                    {filters.coughFeq && (
                                        <Scatter data={pollenChartData} dataKey="cough_total" fill='#8884d8' strokeWidth={3} r = {8}
                                        />)}
                                    {filters.coughFeq && filters.cougEvent && (
                                        <Scatter
                                            data={pollenChartData}
                                            dataKey="cough_total"
                                            shape = {(props) => 
                                            <PushpinShape
                                                {...props}
                                                onHover={setHoveredPinIndex}
                                                onLeave={() => setHoveredPinIndex(null)} />}
                                        />)}
                                    
                                </ComposedChart>
                            </ResponsiveContainer>
                            {/* hover function */}
                            {/* color block */}
                            {hoveredBlockIndex && (
                                <div style={{ position: 'relative' }}>
                                    <div 
                                        style={{
                                            position: 'absolute',
                                            top: blockTooptipPos.y - 80,
                                            left: blockTooptipPos.x + 30,
                                            background: 'white',
                                            border: '1px solid #888',
                                            padding: '8px',
                                            borderRadius: '6px',
                                            whiteSpace: 'pre-line',
                                            pointerEvents: 'auto',
                                            fontSize: 12,
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                                        }}
                                    >
                                        {blockTooptipPos.content}
                                    </div>
                                </div>
                            )}
                            {/* PinPush */}
                            {hoveredPinIndex && (
                                <div
                                    style={{position: 'relative'}}
                                    onMouseLeave={() => setHoveredPinIndex(null)}
                                >
                                    <div
                                    style={{
                                        position: 'relative',
                                        top: hoveredPinIndex.y - 210,
                                        left: (hoveredPinIndex.x + 180 > 800) 
                                                ? hoveredPinIndex.x - 200
                                                : hoveredPinIndex.x + 30,
                                        background: 'white',
                                        border: '1px solid #888',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        whiteSpace: 'pre-line',
                                        pointerEvents: 'auto',
                                        fontSize: 12,
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                                    }}
                                    > 
                                    {hoveredPinIndex.content}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {/* Section 3: Medication Usage + Notes */}
                    {section3Visible && (
                        <div className={style.Section} style={{height: `${100 / visibleSections}%`}}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={pollenChartData}>
                                    {/* X axis: based on date */}
                                    <XAxis
                                        dataKey= "date"
                                        type='category'
                                        tick = {{fontSize: 12}}
                                        interval={0} 
                                        domain={[...pollenChartData.map(d => d.date), " "]}  // add a dummy value
                                        ticks={[...pollenChartData.map(d => d.date), " "]} //visual it
                                    />
                                    {/* y axis: based on the "period" label */}
                                    <YAxis
                                        type="number"
                                        dataKey={null}
                                        domain={[0, timePeriods.length - 1]}
                                        ticks={timePeriods.map((_, i) => i)}
                                        tickFormatter={(tick) => timePeriods[tick] || ""}
                                        tick={{ fontSize: 10 }}
                                    />

                                    <CartesianGrid strokeDasharray= "3 3" horizontal={true} vertical={false} />
                                    {filters.med && (
                                        <Customized
                                            component={({xAxisMap, yAxisMap, height, width}) => {
                                                const xAxis = xAxisMap[Object.keys(xAxisMap)[0]];
                                                const yAxis = yAxisMap[Object.keys(yAxisMap)[0]];
                                                
                                                const xScale = xAxis.scale;
                                                const yScale = yAxis.scale

                                                const xDomain = [...pollenChartData.map(d => d.date), " "];
                                                const xStep = width / xDomain.length;
                                                const xBandwidth = xStep;//width of the rectangle

                                                const yStep = height / timePeriods.length;
                                                const yBandwidth = yStep ;//height of the rectangle

                                                const rectangles = [];
                                                //for each object
                                                pollenChartData.forEach((day) => {
                                                    //fill up all period, even there is no medication record here
                                                    const fullMedEntries = timePeriods
                                                        .filter(p => p !== "")//skip the dummy value
                                                        .map(p => {
                                                            const found = (day.medication ?? []).find(m => m.period ===p);//check whether or not there is a "period" value
                                                            return found || {period : p, medication: []};
                                                        })
                                                    //console.log(fullMedEntries)
                                                    //for each medication varible(also object actually) in each object
                                                    fullMedEntries.forEach((entry) =>{
                                                        const x = xScale(day.date);//since x axis is date, match it
                                                        const y = yScale(timePeriods.indexOf(entry.period));

                                                        //test purpose
                                                        //console.log("xScale.domain():", xScale.domain?.()); // should be ["06-17", "06-18", ...]
                                                        //console.log("x:", xScale(day.date)); // should be a non-zero number, such as 80, 120
                                                        //console.log("xBandwidth:", xBandwidth); // should be a non-zero number, such as 40
                                                        //console.log("entry.period:", entry.period, "y:", y, "medications:",entry.medications); //period should be like "09:00-12:00"

                                                        if(x === undefined || y === undefined) return;
                                                        //note: In "medication" varible, we have a varible called "medications"
                                                        const meds = Array.isArray(entry.medications) ? entry.medications : [];
                                                        const total = meds.length;//how many medication usage here totally
                                                        const onTime = meds.filter(m => m.on_time).length;//how many of them that user take on time
                                                        const ratio = total > 0 ? onTime / total : null;
                                                        const color = total > 0 ? getMedColor(ratio) : "#eee"; //color for rectangle
                                                        //test purpose
                                                        //console.log(`Drawing rectangle at x=${x}, y=${y}, width=${xBandwidth}, height=${yBandwidth}, color=${color}`);
                                                        rectangles.push(
                                                            <Rectangle
                                                                key={`${day.date}-${entry.period}`}
                                                                x={x}
                                                                y={y}
                                                                width={xBandwidth}
                                                                height={yBandwidth}
                                                                fill={color}
                                                                stroke='#ccc'
                                                                onClick={() => {
                                                                    if(hoverInfo){//lock current hover information
                                                                        setToolTipLocked(hoverInfo);
                                                                    }
                                                                }}
                                                                onMouseEnter={() => {
                                                                    if(tooltipLocked) return;//if locked(or if it's not null), system will not show any other tooltip until unlock
                                                                    const notesCopy = Array.isArray(day.note) ? day.note : [];
                                                                    const MatchedNotes = notesCopy.filter(n => n.period === entry.period);
                                                                    //console.log("hello?")
                                                                    const newHover ={
                                                                        x, y,//position
                                                                        date: day.date,
                                                                        period: entry.period,
                                                                        note: MatchedNotes,//get original note object array only
                                                                        medications: entry.medications ?? []//get original medication object array only
                                                                    }
                                                                    //Optimize: prevent re-rendering too much times(previous version will print more than 10 times "hello?" in one hover, this new version only print 2 times)
                                                                    setHoverInfo(prev =>
                                                                        JSON.stringify(prev) === JSON.stringify(newHover) ? prev : newHover
                                                                    );                                                                    
                                                                }
                                                                }
                                                                onMouseLeave={() => setHoverInfo(null)}
                                                            />
                                                        );
                                                        //also include note icon
                                                        const hasNote = (day.note ?? []).some(n => n.period === entry.period);//if entry period(in medication varible) is same as the note period, we should add a icon in this rect
                                                        if(hasNote) {
                                                            rectangles.push(
                                                                <text
                                                                    key={`note-icon-${day.date}-${entry.period}`}
                                                                    x={x + xBandwidth / 2}
                                                                    y={y + yBandwidth/2 + 4}
                                                                    textAnchor='middle'
                                                                    fontSize={16}
                                                                    fill='#000'
                                                                >
                                                                    ❖
                                                                </text>
                                                            );
                                                        }
                                                    });//end of inner forEach()
                                                });//end of outer forEach()

                                                return <g>{rectangles}</g>
                                            }}//end of componet = {...}
                                        />//end of <Customized>
                                    )}
                                    {/* hover functionality: code structure is some different with section2 */}
                                    {(tooltipLocked || hoverInfo) && (
                                        <foreignObject
                                            x={(tooltipLocked || hoverInfo).x + 10}
                                            y={(tooltipLocked || hoverInfo).y - 10}
                                            width={220}
                                            height={Math.max(300, 40 + (tooltipLocked || hoverInfo).note.length * 28 + (tooltipLocked || hoverInfo).medications.length * 20)}
                                        >
                                            <div style={{
                                                background:"rgba(0,0,0,0.8)",
                                                color: "white",
                                                padding: "6px 10px",
                                                borderRadius: "4px",
                                                fontSize: "12px",                                             
                                                overflowY: "auto",
                                            }}>
                                                {/* hover information */}
                                                <div><strong>{(tooltipLocked || hoverInfo).date}</strong> | {(tooltipLocked || hoverInfo).period}</div>
                                                {/*console.log("hoverInfo.note:", hoverInfo.note[0].notes)*/}
                                                {(tooltipLocked || hoverInfo).note.length > 0 && (
                                                    <div>
                                                        <em>Note: </em>
                                                        <ul style={{margin: 0, paddingLeft: "16px", lineHeight: "1.4"}}>
                                                            {(tooltipLocked || hoverInfo).note.map((n, i) => (
                                                                <React.Fragment key={i}>
                                                                {n.notes.map((note, j) => (
                                                                  <li key={`${i}-${j}`}>
                                                                    [{note.label}] Writing: {note.text} at {note.hour?.split("T")[1].slice(0, 5)} 
                                                                    (Self-Assess score: {note.health_score})
                                                                  </li>
                                                                ))}
                                                              </React.Fragment>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {(tooltipLocked || hoverInfo).medications.length > 0 && (
                                                    <div>
                                                        <em>Medications: </em>
                                                        <ul style={{margin: 0, paddingLeft: "16px", lineHeight: "1.4"}}>
                                                            {(tooltipLocked || hoverInfo).medications.map((m, i) => (
                                                                <li key={i}>
                                                                    {m.medication} at {m.hour?.split("T")[1].slice(0, 5) || "?"} (Status: {m.on_time ? "✔" : "✖"})
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {/* button to unlock */}
                                                {tooltipLocked && (
                                                    <button onClick={() => setToolTipLocked(null)}>Unlocked</button>
                                                )}
                                            </div>
                                        </foreignObject>
                                    )}
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                <aside className={style.SideBar}>
                    <div className={style.FilterBox}>
                        <h2>Filter</h2>
                        <label><input type='checkbox' checked={filters.act} onChange={() => setFilter(f => ({...f, act: !f.act}))}/>ACT</label>
                        <label><input type='checkbox' checked={filters.pollen} onChange={() => setFilter(f => ({...f, pollen: !f.pollen}))}/>Pollen Level</label>
                        <label><input type='checkbox' checked={filters.breathlessness} onChange={() => setFilter(f => ({...f, breathlessness: !f.breathlessness}))}/>Breath</label>
                        <label><input type='checkbox' checked={filters.coughFeq} onChange={() => setFilter(f => ({...f, coughFeq: !f.coughFeq}))}/>Cough Frequency</label>
                        <label><input type='checkbox' checked={filters.med} onChange={() => setFilter(f => ({...f, med: !f.med}))}/>Medication</label>
                        {/*<label><input type='checkbox' checked={filters.notes} onChange={() => setFilter(f => ({...f, notes: !f.notes}))}/>Note</label>*/}
                        <label><input type='checkbox' checked={filters.cougEvent} onChange={() => setFilter(f => ({...f, cougEvent: !f.cougEvent}))}/>Cough Event</label>
                    </div>
                    <button className={style.SideButton} onClick={() => setShowModal(true)}>Edit notes/data</button>
                    <button className={style.SideButton} onClick={() => setShowSummaryModal(true)}>Summary</button>
                    <button className={style.SideButton} onClick={() => setShowHistoryModal(true)}>View History Report</button>
                    <button className={style.SideButton}>Set inflection point</button>
                </aside>
            </div>
            {/* Editor Modal + calling backend operation */}
            {showModal && (
                <Data_NoteEditor
                    lockedInfo={tooltipLocked}
                    onClose={() => setShowModal(false)}/>
            )}
            {/* Summary Modal + processing animation (Note: currently they are working seperately with LLM, not integrate yet) */}
            {showSummaryModal && (
                <SummaryModal onClose={() => setShowSummaryModal(false)}/>
            )}
            {/* History Review Modal */}
            {showHistoryModal && (
                <HistorySummary onClose={() => setShowHistoryModal(false)}/>
            )}
            <div className={style.Footer}>
                Footer Contents
            </div>
        </div>
    );
}

export default Explore_data