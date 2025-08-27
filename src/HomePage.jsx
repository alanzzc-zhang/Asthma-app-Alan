import React, { useState, useEffect } from 'react';
import { Search, Settings, Moon, Sun, ToggleLeft, Menu } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away.css';

import MiniTrackingACTPanel from './MiniTrackingACTPanle';
import MiniTrackingMA from './MiniTrackingMA';

function MiniTrackingCoughPanel({ data }) {
    if (!Array.isArray(data) || data.length === 0) return <div>Loading…</div>;

    const sorted = [...data].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
    );
    const last7 = sorted.slice(-7);

    return (
        <div className="DotsWrapper">
            <div className="MiniTrackingContent">
                {last7.map((entry, i) => {
                const prev = i > 0 ? last7[i - 1].cough_count : entry.cough_count;
                const up = entry.cough_count > prev;
                const color = up ? 'green' : 'red';
                const tooltip = `Date: ${entry.date}\nCoughs: ${entry.cough_count}\n${up ? 'Up' : 'Down'}`;

                return (
                    <Tippy
                    key={entry.date}
                    content={tooltip}
                    animation="shift-away"
                    arrow={false}
                    theme="light-border"
                    maxWidth={200}
                    duration={200}
                    popperOptions={{ strategy: 'fixed' }}
                    >
                    <div
                        className={up ? 'Mini_dotUp' : 'Mini_dotDown'}
                    />
                    </Tippy>
                );
                })}
            </div>
        </div>
  );
}

export default function Sample() {
    const [UserName] = useState('Alan');
    const [DataJSON, setData] = useState(null);

    useEffect(() => {
        fetch('./exploreData.json')
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(json => setData(json))
        .catch(console.error);
    }, []);

    return (
        <div>
            <div className="HomeBody">
                <h1 className="HomePageTitle">Home</h1>
                <p className="HomePageGreeting">
                    Welcome back! {UserName}
                </p>
            <div className="HomeGrid">
            <section className="ToDoPanel">
                <h2 className="PanelTitle">Today's To-do List</h2>
                <div className="HomepanelBody">…</div>
            </section>
            <section className="ForecastPanel">
                <h2 className="PanelTitle">Wellness Forecast</h2>
                <div className="HomepanelBody">…</div>
            </section>
            <section className="MiniTrackingPanel">
                <h2 className="PanelTitle">Mini Tracking</h2>

                <div className="HomePageMiniTrackerHeader">
                    <h3 className="Mini_trendTitle">Cough Trend:</h3>
                    <MiniTrackingCoughPanel data={DataJSON} />
                </div>

                <div className="HomePageMiniTrackerHeader">
                    <h3 className="Mini_ACTTitle">ACT Score:</h3>
                    <div className="HomepanelBody">
                        <MiniTrackingACTPanel data={DataJSON} />
                    </div>
                </div>

                <div className="HomePageMiniTrackerHeader HomePageMiniTrackerHeaderMA">
                    <h3 className="Mini_MATitle">Medication Adherence:</h3>
                    <MiniTrackingMA data={DataJSON} />
                </div>
            </section>
            <section className="SummaryPanel">
                <h2 className="PanelTitle">Today's Summary</h2>
                <div className="HomepanelBody">…</div>
            </section>
            </div>
        </div>
    </div>
  );
}