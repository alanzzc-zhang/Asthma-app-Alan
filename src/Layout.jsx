import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Search, Settings, Moon, Sun, ToggleLeft, Menu } from 'lucide-react';
import style from './HomePage.module.css';

function Layout(){
    const[KeyWords, setKey] = useState("");//use to searching something(future work)
    const [darkMode, setDarkMode] = useState(false);//use to switch to dark mode
    const [sidebarOpen, setSidebarOpen] = useState(false);//use to control side bar
    const [isDayTime, setIsDayTime] = useState(true);//use to control sun/moon icon
    const [currentTime, setCurrentTime] = useState('');//Current time, use to tooltip

    useEffect(() => {
        const now = new Date();
        setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setIsDayTime(now.getHours() >= 6 && now.getHours() <= 18);
      }, []);
    function handleKeyWords(){

    }
  
    //function to switch dark mode
    function toggleDarkMode(){
        setDarkMode(p => !p);
    }
    const toggleSidebar = () =>{
        setSidebarOpen(o => !o);
    }
    return(
        <div className={`${style.appContainer} ${darkMode ? 'app-dark' : 'app-light'}`}>
            {/* Top navigation bar part */}
            <div className= {style.topNavigationBar}>
                {/*Left hand side: Icon + Setting button */}
                <div className={style.settingContainer}>
                    <Settings className={style.settingIcon} size={20}></Settings>
                    <span className={style.setting}>Setting</span>
                    {/* side bar */}
                    <div className={`${style.ToggleSetBar} ${sidebarOpen ? style.ToggleSetBarShift:''}`}
                        onClick={toggleSidebar}>
                         <Menu size={30}/>
                    </div>
                </div>

                <aside className={`${style.sidebar} ${sidebarOpen ? style.open:''}`}>
                    <nav>
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/Real_Time_Tracking">Real Time Tracking</Link></li>
                            <li><Link to="/Explore_Data" >Explore Your Data</Link></li>
                            <li><Link to="/SampleTwo">List 3</Link></li>
                        </ul>
                    </nav>
                </aside>

                {/*Logo + Searching block */}
                <div className={style.centerGroup}>
                    <span className={style.logo}>Asthma App</span>
                    <input className ={style.searchInput}
                        type="text" 
                        placeholder="Searching key words" 
                        value={KeyWords} 
                        onChange={handleKeyWords}></input>
                    {/* Searching Icon */}
                    <Search className={style.searchIcon} size={16}/>
                </div>

                {/* Avatar */}
                <div className={style.avatarContainer}>
                    <span className={style.avatar}>Z</span>

                </div>
            </div>

            <div className={style.iconGroup}>
                
                {/* Sun/Moon icon switching */}
                <div className={`${style.rightControls} timeTooltip`}data-tooltip ={currentTime}>{/*we need use data-tooltip in the parent element */}
                    {isDayTime ? 
                    (<Sun className={style.timeIcon} size={20} aria-label="Daytime" />)
                     : (<Moon className={style.timeIcon} size={20} aria-label="Nighttime"/>)}
                </div>
                {/* dark mode toggle */}
                <div data-tooltip ="Dark Mode" >
                    <ToggleLeft 
                        className={`${style.toggleIcon} timeTooltip`}
                        size={20}
                        onClick={toggleDarkMode}
                        aria-label='Toggle theme'
                    >
                    </ToggleLeft>
                </div>
               
            </div>

            {/* ——— Main Content ——— */}
            <div className={`${style.mainContent} ${sidebarOpen ? style.shift : ''}`}>
                {/* body */}
                <Outlet />
            </div>
        </div>
    );
}

export default Layout