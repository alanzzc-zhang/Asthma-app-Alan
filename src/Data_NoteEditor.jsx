import { AlertTriangle } from "lucide-react";
import React, { useState } from "react";
//CSS style of this jsx file is at the buttom, called "styles"
function Data_NoteEditor({lockedInfo, onClose}){
    const [mode, setMode] = useState('note');//use to switch to 'note' side or 'medication' side

    //a deep copy that allow to edit
    //copy of "note" variable
    //from note: {period: xxx , notes:{hour, text, id, label}} to {period: xxx , hour: xxx, label: xxx, ...}
    const[editedNotes, setEditedNotes] = useState (() => 
        (lockedInfo?.note || [])
            .flatMap(periopEntry => 
                (periopEntry.notes || []).map(note =>({
                    ...note,
                    period: periopEntry.period,
                    isEdited: false
                }))
            )
    );
    //copy of "medication" variable
    const [editedMeds, setEditedMeds] = useState(() =>
        lockedInfo?.medications?.map( m => ({...m,  isEdited: false})) || []
    );
    //if click the buttom before "lock" some information to edit
    if(!lockedInfo){
        return(
            <div style={styles.overLayInfo}>
                <div style={styles.modal}>
                    <div style={{padding: '20px'}}>
                        <p>Please lock a tooltip before click this buttom to edit it's content</p>
                        <button onClick={onClose} style={styles.closeBtn}>X</button>
                    </div>
                </div>
            </div>
        )
    }

    const handleNoteChange = (index, field, value) => {
        const updated = [...editedNotes];//get a original data
        updated[index][field] = value;//change it
        updated[index].isEdited = true;//mark it
        setEditedNotes(updated)//update it
        console.log("Note handle updated: ", editedNotes)
    }

    const handleMedChange = (index, field, value) => {
        const updated = [...editedMeds];
        updated[index][field] = value;
        updated[index].isEdited = true;
        setEditedMeds(updated);
    }
    const handleConfirm = async () => {
        const date = editedNotes[0].hour?.split('T')[0];
        const hour = editedNotes[0].hour?.split('T')[1];

        const dateForFile = date.replace(/-/g, "_");//2025-06-01 -> 2025_06_01

        //get the unique id for backend updating (help to find which one we should update)
        const updatedNotes = editedNotes.filter(n => n.isEdited);
        const updatedNoteIds = updatedNotes.map(n => n.id);
        const updatedMeds = editedMeds.filter(m => m.isEdited);
        const updatedMedIds = updatedMeds.map(m => m.id);

        //test purpose
        //console.log("Updated notes to send:", updatedNotes);
        //console.log("Received updated note IDs:", updatedNoteIds);

        //construct the data we want "POST"
        const body = {
            dateForFile,
            date,
            hour,
            newNotes: updatedNotes,
            newMeds: updatedMeds,
            updatedNoteIds,
            updatedMedIds
        };

        try{//try to call MyServer.js in backend, and send the data to it
            const response = await fetch('http://localhost:3000/update_summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            //output some message to show what's happened
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
        //console.log('Updated Notes: ', editedNotes);
        onClose();
    }

    return(
        <div style={styles.overLayInfo}>
            <div style={styles.modal}>
                {/* button "X" to close thie overlay*/}
                <button onClick={onClose} style={styles.closeBtn}>X</button>
                <h3>Edit Content --- {lockedInfo.date} | {lockedInfo.period}</h3>

                {/* button to switch the content that will be displayed */}
                <button onClick={() => setMode(mode === 'Note' ? 'Medication' : 'Note')} style={styles.switchBtn}>
                    Switch to {mode === 'Note'? 'Medication' : 'Note'} part
                </button>

                {/* diplay information */}
                <div style={styles.contentBox}>
                    {mode === 'Note' && editedNotes.map((note, i) => (
                        <div key={i} style={styles.entryBox}>
                            <div><strong>Label:</strong><br/><input value={note.label} onChange={e => handleNoteChange(i, 'label',e.target.value)}></input></div>
                            <div><strong>Text:</strong><br/><input value={note.text} onChange={e => handleNoteChange(i, 'text',e.target.value)} rows={3} style={{ width: '100%' }}></input></div>
                            <div><strong>Health score:</strong><br/><input value={note.health_score} onChange={e => handleNoteChange(i, 'health_score',e.target.value)}></input></div>
                        </div>
                    ))}
                    {mode === 'Medication' && editedMeds.map((med, i) => (
                        <div key={i} style={styles.entryBox}>
                            <div><strong>Time:</strong> {med.hour?.split('T')[1].slice(0,5) || '?'}</div>
                            <div><strong>Medication Name: </strong><input value={med.medication} onChange={e => handleMedChange(i, 'medication', e.target.value)}></input></div>
                            <div><strong>Status:</strong> {med.on_time ? 'Yes' : 'No'}</div>
                        </div>
                    ))}
                </div>
                <button onClick={handleConfirm} style={styles.button}>Confirm</button>
            </div>
        </div>//end of overlayInfo
    );
}

const styles = {
    overLayInfo: {
        position:'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000
    },
    modal: {
        background: '#fff', padding: '20px', borderRadius: '8px', width: '600px', maxHeight: '80%', overflowY: 'auto', position: 'relative'
    },
    closeBtn: {
        position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer'
    },
    switchBtn: {
        marginTop: '12px', padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
    },
    button: {
        marginTop: '12px', padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
    },
    contentBox: {
        maxHeight: '360px', overflowY: 'auto', paddingRight: '8px'
    },
    entryBox: {
        padding: '10px', marginBottom: '12px', borderBottom: '1px solid #ccc'
    }
};

export default Data_NoteEditor