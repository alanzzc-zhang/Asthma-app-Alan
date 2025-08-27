import React, {useState} from 'react'
import style from './TimeSelection.module.css'
function TimeSelection({label, selectedDate, OnChange, compareDate, isFrom}){
    const [tempYear, setTempYear] = useState(selectedDate.getFullYear());
    const [tempMonth, setTempMonth] = useState(selectedDate.getMonth() + 1);
    const [tempDay, setTempDay] = useState(selectedDate.getDate());
    //check user whether or not click the button
    const [open, setOpen] = useState(false);

    //create array for displaying if user indeed clicking the button
    const years = Array.from({length: 100}, (_, i) => 2025 - i)
    const mouths = Array.from({length: 12}, (_, i) => i + 1)// 1 - 12
    //generate days, based on the current month
    const getDaysInMonth = (year, month) =>{
        return new Date(year, month, 0).getDate();
    }
    //generate specfic days based on selected month
    const daysInMonth = getDaysInMonth(tempYear, tempMonth);
    const validsDays = Array.from({length: daysInMonth}, (_, i) => i + 1);

    //check whether is in a valid range(Upper bound is current date)
    const newDate = new Date(tempYear, tempMonth - 1, tempDay)
    const isValidRange = (y, m ,d) =>{
        if(!compareDate) return true;//if nothing here, just return true
        const newDate = new Date(y, m-1, d)
        return isFrom ? newDate <= compareDate : newDate >= compareDate
    }
    //will send a message when user wants to click "confirm" but the input is invalid
    const [errMSG, setErrorMSG] = useState('');
    const confirmSection = () =>{
        
        if(isValidRange(tempYear, tempMonth, tempDay)){
            setErrorMSG('');//clear the message
            OnChange(new Date(tempYear, tempMonth-1, tempDay));//update the value
            setOpen(false);//hidden the panel 
        }else{//send error message
            console.log("Hello?")
            setErrorMSG(isFrom
                ? "❗Start date must be before or equal to end date."
                : "❗End date must be after or equal to start date.")
        }
    }
    //for the cancel buttom in the dropdown panel
    const cancelSelection = () =>{
        //back to the previous, and hidden the panel
        setTempYear(selectedDate.getFullYear());
        setTempMonth(selectedDate.getMonth() + 1);
        setTempDay(selectedDate.getDate());
        setOpen(false);
    }
    
    return(
        <div className={style.TimeSelectWrapper}>{/* button to show Scroll Wheel */}
            <button className={style.ToggleButton} onClick={() => setOpen(p => !p)}>
                {selectedDate.getFullYear()}/{(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/{selectedDate.getDate().toString().padStart(2, '0')}
            </button>
             
            {open && (
                <>
                {/* Time Picker */}
                <div className= {style.DropDown}>
                    <div className= {style.DatePickers}>
                        <select value={tempYear} 
                            onChange={e =>{
                                const newVal = Number(e.target.value);
                                setTempYear(newVal);
                                if(isValidRange(newVal, tempMonth, tempDay)){
                                    setErrorMSG('');
                                }
                            }}>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select value={tempMonth} 
                            onChange={e => {
                                const newVal = Number(e.target.value);
                                setTempMonth(newVal);
                                if(isValidRange(tempYear, newVal, tempDay)){
                                    setErrorMSG('')
                                }
                            }}>
                            {mouths.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select value={tempDay} 
                            onChange={e => {
                                const newVal = Number(e.target.value);
                                setTempDay(newVal);
                                if(isValidRange(tempYear, tempMonth, newVal)){
                                    setErrorMSG('')
                                }
                            }}>
                            {validsDays.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    {/* Error Message */}
                    {errMSG && (
                        <div className={style.ErrorMsg}>{errMSG}</div>
                    )}
                    {/* click "yes", system will update based on user's selection. If click "no", will return back to the previous */}
                    <div className={style.DropDownActions}>
                        <button onClick={confirmSection} >Confirm</button>
                        <button onClick={cancelSelection}>Cancel</button>
                    </div>
                </div>
                </>            
                
            )}
        </div>
    );
}

export default TimeSelection