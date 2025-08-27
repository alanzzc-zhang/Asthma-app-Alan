import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away.css';

function MiniTrackingACTPanel({data}){
    if (!Array.isArray(data) || data.length === 0) {
        return <div>Loading…</div>;
    }
    // sort data by date(see exploreData.json)
    const sortedData = [...data].sort((a,b) => new Date(a.date) - new Date(b.date));
    //get the ACT score from the data
    const Scores = sortedData.filter(entry => entry.act_score !== undefined);

    if(Scores.length < 2) return null;
    //console.log(Scores);//test
    const trend = Scores[Scores.length - 1].act_score - Scores[Scores.length -2].act_score;
    const direction = trend > 0 ? 'Mini_dotUp' : (trend < 0 ? 'Mini_dotDown' : 'Mini_flat');
    const tooltipText = `${Scores[Scores.length -2].act_score} => ${Scores[Scores.length - 1].act_score} \n ${(direction == 'Mini_dotDown') ? 'Not Worry, you will be fine!': 'Keep going, you are on the right track'}`
    return (
        <div className="MiniTrackingContent">
          <Tippy
            content={tooltipText}
            animation="shift-away"
            arrow={false}
            theme="light-border"
            maxWidth={200}
            duration={200}
            popperOptions={{ strategy: 'fixed' }}
          >
            <div className={direction} />
          </Tippy>
        </div>
      );
}

export default MiniTrackingACTPanel