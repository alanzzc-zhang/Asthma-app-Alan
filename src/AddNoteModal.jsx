import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";


function AddNoteModal({onClose, date}){
    const [label, setLabel] = useState("");//store the "label" information
    const [customLabel, setCustomLabel] = useState("");//showing some preset label
    const [text, setText] = useState("");//store the "text" information
    const [healthScore, setHealthScore] = useState("");//store the "health_score" information
    const [emotion, setEmotion] = useState("");//store the "emotion" information
    const [customEmotion, setCustomEmotion] = useState("");//showing some preset label
    const [moodScore, setMoodScore] = useState("");//store the "mood_score" information
    const [activity, setActivity] = useState("");//store the "activity" information

    //if click preset label, automatically select this 
    useEffect(() => {
        if (customLabel) setLabel(customLabel);
    }, [customLabel]);

    useEffect(() => {
        if (customEmotion) setEmotion(customEmotion);
    }, [customEmotion]);

    const labelPresets = ["routine", "symptom", "environment"];
    const emotionPresets = ["happy", "sad", "anxious"];

    const handleConfirm = async() => {
        if(!label || !text || !healthScore) return; //double check
        //package the data point
        const NewNote = {
            date,
            id: uuidv4(),
            label: label,
            text: text,
            health_score: Number(healthScore),
            mood_score: moodScore ? Number(moodScore) : null,
            emotion: emotion ? emotion : null,
            activity: activity ? activity: null
        }
        try{//try to call MyServer.js in backend, and send the data to it
            const response = await fetch('http://localhost:3000/add_note', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(NewNote)
            })
            //print something, so we can know What's happened
            const result = await response.json()
            if(response.ok){
                console.log("Update Successful:", result);
                alert("Update successful!");
            }else{
                console.error("Update failed: ", result.error);
                alert("Failed to update: " + result.error);
            }

        }catch(err){
            console.error("Fetch Error: ", err);
            alert("Something goes wrong!")
        }
        onClose();
    }
    const isConfirmDisabled = !label || !text.trim() || !healthScore;//user must fill up "label", "text" and "healt_score"

    return(
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button style={styles.closeBtn} onClick={onClose}>{/* close buttom at right corn of the modal */}
                    X
                </button>
                <h2 style={styles.title}>Add a New Note</h2>{/* modal title */}

                {/* "label" part */}
                <div style={styles.section}>
                    <div style={styles.label}>Label (required):</div>
                    <div style={styles.buttonRow}>
                        {labelPresets.map((item) => (
                            <button
                                key={item} 
                                style={{
                                    ...styles.tagButton,
                                    backgroundColor: label === item ? "#007bff" : "#f0f0f0",
                                    color: label === item ? "white" : "black",
                                }} 
                                onClick={() => {
                                    if(label === item){
                                        setLabel("");
                                        setCustomLabel("");
                                    }else{
                                        setLabel(item)
                                        setCustomLabel(item);
                                    }
                                }}
                            >
                                {item}
                            </button>
                        ))}{/* end of labelPresets.map() */}
                    </div>
                    {/* Input area */}
                    <input 
                        type="text" 
                        placeholder="Or enter custom label" 
                        style={styles.input} value={customLabel} 
                        onChange={(e) => {
                            setCustomLabel(e.target.value)
                            setLabel("")
                        }}
                    />
                </div>

                {/* "text" part */}
                <div style={styles.section}>
                    <div style={styles.label}>Note Text (required):</div>
                    {/* Input area */}
                    <textarea placeholder="Describe anything you want" style={styles.textarea} value={text} onChange={(e) => setText(e.target.value)}/>    
                </div>

                {/* "health_score" part */}
                <div style={styles.section}>
                    <div style={styles.label}>Health Score (0-100, required):</div>
                    {/* Input area */}
                    <input type="number" min={0} max={100} placeholder="e.g. 85" style={styles.input} value={healthScore} onChange={(e) => setHealthScore(e.target.value)}/>
                </div>

                {/* "emotion" part (Optional)*/}
                <div style={styles.section}>
                    <div style={styles.label}>Emotion (optional):</div>
                    <div style={styles.buttonRow}>
                        {emotionPresets.map((item) => (
                            <button
                                key={item}
                                style={{
                                    ...styles.tagButton,
                                    backgroundColor: emotion === item ? "#28a745" : "#f0f0f0",
                                    color: emotion === item ? "white" : "black",
                                }}
                                onClick={() => {
                                    if(emotion === item){
                                        setEmotion("")
                                        setCustomEmotion("")
                                    }else{
                                        setEmotion(item)
                                        setCustomEmotion(item)
                                    }
                                }}
                            >
                                {item}
                            </button>
                        ))}{/* end of emotionPresets.map() */}
                    </div>
                    {/* Input area */}
                    <input 
                        type="text" 
                        placeholder="Or enter your own emotion" 
                        style={styles.input} value={customEmotion} 
                        onChange={(e) => {
                            setCustomEmotion(e.target.value)
                            setEmotion("")
                        }}
                    />
                </div>

                {/* "mood_score" part(only show up if emotion is selected) */}
                {emotion && (
                    <div style={styles.section}>
                        <div style={styles.label}>Mood Score (0-100, optional):</div>
                        {/* Input area */}
                        <input type="number" min={0} max={100} placeholder="e.g. 80" style={styles.input} value={moodScore} onChange={(e) => setMoodScore(e.target.value)}/>
                    </div>
                )}

                {/* "activity" part (Optional) */}
                <div style={styles.section}>
                    <div style={styles.label}>Activity (optional):</div>
                    {/* Input area */}
                    <input type="text" placeholder="e.g. walking, running" style={styles.input} value={activity} onChange={(e) => setActivity(e.target.value)}/>
                </div>
                
                {/* Confirm button at left buttom corner of the modal */}
                <button 
                    style={{
                        ...styles.confirmBtn,
                        backgroundColor: isConfirmDisabled ? "#ccc" : "#007bff",
                        cursor: isConfirmDisabled ? "not-allowed" : "pointer",
                    }}
                    disabled={isConfirmDisabled}
                    onClick={handleConfirm}
                >
                    Confirm
                </button>
            </div>
        </div>
    );//end of return()
}

//CSS style
const styles = {
    overlay: {
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.5)", display: "flex",
        justifyContent: "center", alignItems: "center", zIndex: 1000,
    },
    modal: {
        background: "#fff", padding: "24px", borderRadius: "12px", width: "90%", maxWidth: "500px", position: "relative", boxSizing: "border-box",
    },
    closeBtn: {
        position: "absolute", top: 10, right: 14, fontSize: 22, background: "transparent", border: "none", cursor: "pointer",
    },
    title: {
        marginBottom: 10, fontSize: 20,
    },
    section: {
        marginBottom: 16,
    },
    label: {
        fontWeight: "bold", marginBottom: 6,
    },
    input: {
        width: "100%", padding: "8px", fontSize: "14px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box",
    },
    textarea: {
        width: "100%", height: "80px", padding: "8px", fontSize: "14px", borderRadius: "6px", border: "1px solid #ccc", resize: "vertical",
        boxSizing: "border-box",
    },
    buttonRow: {
        display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px",
    },
    tagButton: {
        padding: "6px 12px", borderRadius: "16px", border: "1px solid #ccc", backgroundColor: "#f0f0f0", cursor: "pointer",
    },
    confirmBtn: {
        width: "100%", padding: "10px", fontSize: "16px", borderRadius: "8px", border: "none", color: "white",
    }
}

export default AddNoteModal