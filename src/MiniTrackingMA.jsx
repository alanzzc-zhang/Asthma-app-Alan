
function MiniTrackingMA({data}){
    if (!Array.isArray(data) || data.length === 0) {
        return <div>Loading…</div>;
    }
    // sort data by date(see exploreData.json)
    const sortedData = [...data].sort((a,b) => new Date(a.date) - new Date(b.date));
    //calculate last seven days medication adherence
    const windowData = sortedData.slice(-7);
    //caculate how many time user use reliever in last 7 days
    const daysCovered = windowData.reduce((count, entry) =>{
        return count + entry.reliever_usage 
    },0)

    const MArate = windowData.reduce((count, entry) =>{
        //caculate hom many time user didn't use controller
        const NoteKeyWord = entry.notes.reduce((SkipNum, notesElement) => {
            const Num = notesElement.text.includes("Skipped") ? 1 : 0;
            return SkipNum + Num;
        }, 0)
        count.skipped += NoteKeyWord;
        if(entry.controller_med !== null) count.Total += 1
        return count
    },{Total: 0, skipped:0})

    const pdc = MArate.Total/(MArate.Total + MArate.skipped);

    return(
        <div className="MiniTrackingMA">
            <div>PDC: {(pdc *100).toFixed(1)}%</div>
            <div>Reliever: {daysCovered} times</div>
        </div>
    );
}

export default MiniTrackingMA