import style from './RealTimeTracking.module.css';
import React, {useEffect, useRef, useState} from 'react';
import {Link} from "react-router-dom";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceDot,
    ReferenceArea} from 'recharts';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away.css';
import AddNoteModal from './AddNoteModal';
function Real_time_Tracking(){
    //get user's real-time data
    const[data, setData] = useState([]);
    //filter functionaliy
    const[showPollen, setShowPollen] = useState(true);
    const[showCough, setShowCough] = useState(false);
    const[showNotes, setShowNotes] = useState(false);
    const[showMed, setShowMed] = useState(false)

    //hover functionality
    const[tooltip, setToolTip] = useState({
        visible: false,
        x: 0,
        y: 0,
        content: null
    })
    const[tooltipLocked, setToolTipLocked] = useState(false)

    //function to send API request to update the state(FUTURE WORK)
    function handleCheckIn(hourInfo, id){

    }
    //called LLM and return a formated result(still some issue here)
    const handleActionPlan = async() => {
        try{
            const response = await fetch('http://localhost:3000/run_action_plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({dateForFile: '2025_06_17'})
            })
            const result = await response.json();
            if(response.ok){
                console.log("LLM output: ", result)
                alert("Action Plan generating successful!")
            }else{
                console.error("Update failed: ", result.error);
                alert("Failed to update: " + result.error);
            }
        }catch(err){
            console.error("Fetch Error: ", err);
            alert("Something goes wrong!");
        }
    }
    //gather data when component mount
    /* NEED TO ADD DATE DETECTION FOR ACCESSING DIFFERENT SUMMARY FILE IN THE FUTURE */
    const date = "2025_06_21"
    useEffect(() =>{
        fetch(`public/data/hourlySummary_${date}.json`)
        .then(response => response.json())
        .then(rawData => {
            //adjust the format of data
            const formatted = rawData.map(item => {
                //use to create color floor
                const pollen = item.pollen;
                let cat;
                if(pollen < 3.5) cat = 'Low';
                else if(pollen < 7.5) cat = 'Moderate';
                else cat = 'High';

                return{
                    ...item,//formatted data: 2025-06-12T17:00:00 -> 17:00
                    hourLabel: new Date(item.hour).getHours().toString().padStart(2, '0')+':00',
                    pollenCategory: cat
                };
            });
            setData(formatted);
        })
        .catch(console.error);

    },[]);

    //functionality for "Add Note" btn
    const [showNoteModal, setShowNoteModal] = useState(false);

    return(
        <div className={style.RealTimeBody}>
            {/* Page Title */}
            <h1 className={style.PageTitle}>Real-time Tracking</h1>
            {/* main Body */}
            <div className={style.RealTimeGrid}>
                {/* Left side: Main Graph */}
                <div className={style.MainGraph}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{top: 20, right: 30, left: 0, bottom: 0}}>
                            <CartesianGrid stroke="#ccc" strokeOpacity={0.3}/>
                            <XAxis dataKey="hourLabel"/>
                            {/* —— always render this axis, just hide ticks when showPollen=false —— */}
                            
                            {/* pollen 的数值轴 */}
                            <YAxis
                                yAxisId="pollenNum"
                                type="number"
                                hide={!showPollen}
                                domain={[0, 10]}
                                ticks={[1.75, 5.5, 8.75]} // mid points represent low, mid and high, instead of 0 - 10
                                tickFormatter={(value) => {
                                    if (value < 3.5) return 'Low';
                                    if (value < 7.5) return 'Moderate';
                                    return 'High';
                                }}
                                label={{
                                    value: 'Pollen (level)',
                                    angle: -90,
                                    position: 'insideLeft'
                                }}
                                    
                            />
                            <ReferenceArea
                                yAxisId="pollenNum"
                                y1={0}
                                y2={3.5}
                                fill='#82ca9d'
                                fillOpacity={showPollen ? 0.3 : 0}
                                isFront/>
                            <ReferenceArea
                                yAxisId="pollenNum"
                                y1={3.5}
                                y2={7.5}
                                fill='#FFD700'
                                fillOpacity={showPollen ? 0.3 : 0}
                                isFront />
                            <ReferenceArea
                                yAxisId="pollenNum"
                                y1={7.5}
                                y2={10}
                                fill='#FF6B6B'
                                fillOpacity={showPollen ? 0.3 : 0}
                                isFront />

                            {/* cough 的数值轴 */}
                            <YAxis
                                yAxisId="cough"
                                orientation= {showPollen ? "right" : "left"}
                                hide={!showCough}
                                domain={[0, 'dataMax + 1']}
                                label={{
                                    value: 'Cough (times)',
                                    angle: (showPollen ? 90: -90),
                                    position: 'insideRight'
                                }}
                            />
                            {/* Med/Notes default yaxis */}
                            <YAxis
                                yAxisId="default"
                                hide = {(showCough || showPollen) ? true : false}
                                domain={[0, 10]}
                            />
                            {/* Cough and pollen Hover functionality */}
                            <Tooltip 
                                formatter={(value, name) => [`${value}`, name === 'pollen' ? 'Pollen' : 'Cough']}
                                labelFormatter={(label) => `Time Scale: ${label} - ${(parseInt(label) + 1).toString().padStart(2, '0')}:00`}
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #ccc',
                                    fontSize: '12px',
                                    opacity: '0.85'
                                }}
                            />
                            {/* true/false(filter) to trigger visualization */}
                            {showPollen && (
                                
                                <Line yAxisId="pollenNum" type="monotone" dataKey="pollen" name="Pollen" stroke="#82ca9d" dot={{ r: 4 }} isFront={true}/>
                                )
                            }
                            {showCough && (
                                <Line yAxisId="cough" type="monotone" dataKey="cough_count" name="Cough" stroke="#8884d8" dot={{ r: 4 }} />
                            )}
                            {/* First detection is filter function: true/false, second detection is whether or not user write a note */}
                            {showNotes && data.map((e, index) => {
                                if(!e.notes || e.notes.length === 0) return null;
                                const tooltipContent = e.notes.map(n => `${n.label}: ${n.text}`).join('\n');
                                return(
                                <ReferenceDot
                                    key={`note-${index}`}
                                    x={e.hourLabel}
                                    y={
                                        showPollen ? e.pollen
                                        : showCough ? e.cough_count
                                        : 10
                                    }
                                    yAxisId= {showPollen ? 'pollenNum' : showCough ? 'cough' : 'default'}
                                    r={6}
                                    fill="#0000FF"
                                    label={{position: 'top', value:'📝'}}
                                    className={style.Note_Dot}
                                    onClick={() => {
                                        setToolTipLocked(p => !p)
                                    }}
                                    onMouseEnter={() => {
                                        if(tooltipLocked) return;//if locked, no hover
                                        const noteContent = `📝 Note Detail\n`+ 
                                        e.notes.map((n,i) => `Note ${i+1} ${e.hourLabel}\n- ${n.label}: ${n.text}\n- Healthy Subjective Score: ${n.health_score}\n- Feeling: ${n.emotion}\n- Mood Score: ${n.mood_score}`).join('\n\n');
                                        setToolTip({
                                          visible: true,
                                          x: 200, 
                                          y: 50,
                                          content: noteContent
                                        });
                                    }}
                                    onMouseLeave={() => {
                                        if(tooltipLocked) return;//if locked, no hidden
                                        setToolTip({
                                          visible: false,
                                          x: 0,
                                          y: 0,
                                          content: null
                                        });
                                    }}
                                      
                                >
                                </ReferenceDot>
                                )}
                            )}
                            {showMed && data.map((e, index) => 
                                e.medication_status ? e.medication_status.map((m, j) => {
                                    const HourText =  `${e.hourLabel} - ${(parseInt(e.hourLabel) + 1).toString().padStart(2,'0')}:00`
                                    return(
                                    <ReferenceDot
                                    key={`med-${index}-${j}`}
                                    x={e.hourLabel}
                                    y={0}
                                    yAxisId={showPollen ? 'pollenNum' : showCough ? 'cough' : 'default'}
                                    r={6}
                                    fill={m.on_time ? '#00C49F' : '#0088FE'}
                                    label={{ 
                                            position: 'top', 
                                            value: m.on_time ? '✅' : '➡️',
                                    }}
                                    onClick={() => {
                                        setToolTipLocked(p => !p)
                                    }}
                                    onMouseEnter={() => {
                                        if(tooltipLocked) return;//if locked, no hover
                                        setToolTip({
                                          visible: true,
                                          x: 200, 
                                          y: -10,
                                          content: (
                                            <div>
                                                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>💊 Medication Detail</div>
                                                <div>- Reminder ID: {m.id}</div>
                                                <div>- Medication: {m.medication}</div>
                                                <div>- Current Status: {m.on_time ? '' : 'Not '}Completing the event between {HourText}</div>
                                                {!m.on_time && (
                                                    <button onClick={() => handleCheckIn(e.hourLabel, m.id)}>Check In</button>
                                                )}
                                            </div>
                                          )
                                        });
                                    }}
                                    onMouseLeave={() => {
                                        if(tooltipLocked) return;//if locked, no hidden
                                        setToolTip({
                                          visible: false,
                                          x: 0,
                                          y: 0,
                                          content: null
                                        });
                                    }}
                                    />
                                    )
                                }):null
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                    {/* Hover CSS style */}
                    {tooltip.visible && (
                        <div style={{
                            position:'absolute',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            top: tooltip.y,
                            background: 'rgba(255, 255, 255, 0.9)',
                            border: '1px solid #ccc',
                            padding: '12px',
                            fontSize: '14px',
                            pointerEvents: 'none',
                            whiteSpace: 'pre-line',
                            zIndex: 1000,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                            borderRadius: '6px',
                            maxWidth: '320px',
                            color: '#222'
                        }}>
                            {tooltip.content}{/* show textual infomation */}
                            {tooltipLocked && (
                                <div style={{marginTop: '8px', fontSize: '12px', color: '#666'}}>Click again to hide</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right side: Filter function + button */}
                <aside className={style.SideBar}>
                    <div className={style.FilterBox}>
                        <h2>Filter: </h2>
                        <label><input type='checkbox' checked={showPollen} onChange={()=>{setShowPollen(e => !e)}}/>Pollen</label>
                        <label><input type='checkbox' checked={showCough} onChange={()=>{setShowCough(e => !e)}}/>Cough</label>
                        <label><input type='checkbox' checked={showNotes} onChange={()=>{setShowNotes(e => !e)}}/>Notes</label>
                        <label><input type='checkbox' checked={showMed} onChange={()=>{setShowMed(e => !e)}}/>Medication</label>
                    </div>
                    <button className={style.SideButton} onClick={handleActionPlan}>Action Plan</button>
                    <button className={style.SideButton} onClick={() => setShowNoteModal(true)}>Add Note</button>
                </aside>
                {showNoteModal && (
                    <AddNoteModal onClose={() => setShowNoteModal(false)} date={date}/>
                )}

                {/* Two child panel */}
                <div className={style.ButtomPanels}>
                    <section className={style.UpcomingEvent}>UpcomingEvent</section>
                    <section className={style.Pending}>Pending</section>
                </div>

                {/* Footer */}
                <footer className={style.Footer}>Footer Content</footer>
            </div>
        </div>
    );
}

export default Real_time_Tracking