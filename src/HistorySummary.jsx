import React, { useState, useEffect } from "react";

function HistorySummary({onClose}) {
    const [selectedType, setSelectedType] = useState("personal"); // 'personal' or 'doctor'
    const [summaryList, setSummaryList] = useState([]);// use to get the Summary Info from JSON file

    // Load summary data when type change
    useEffect(() => {
        const fetchData = async() => {
            try{
                const res = await fetch(`/HistorySummary/${selectedType}.json`);//fetching the data
                const data = await res.json();
                setSummaryList(data);
            }catch(err){
                console.error("Failed to load summary history:", err);//send a error message and clean the List
                setSummaryList([]);
            }
        }

        fetchData();
    },[selectedType]);//only trigger when Type is changed

    return(
        <div style={styles.modalOverlay}>
            <div style={styles.modalBox}>
                {/* Modal Title + Close button */}
                <div style={styles.headerBar}>
                    <h2 style={styles.pageTitle}>Summary History</h2>
                    <button style={styles.closeBtn} onClick={onClose}>X</button>
                </div>

                {/* Toggle button at top of the page */}
                <div style={styles.toggleBar}>
                    <button 
                        style={{
                            ...styles.toggleButton,
                            backgroundColor: selectedType === "personal" ? "#007bff" : "#e0e0e0",
                            color: selectedType === "personal" ? "#fff" : "#333",
                        }}
                        onClick={() => setSelectedType("personal")}
                    >
                        Personal
                    </button>
                    <button
                        style={{
                            ...styles.toggleButton,
                            backgroundColor: selectedType === "doctor" ? "#007bff" : "#e0e0e0",
                            color: selectedType === "doctor" ? "#fff" : "#333",
                        }}
                        onClick={() => setSelectedType("doctor")}
                    >
                        Doctor-Faced
                    </button>
                </div>

                {/* Summary table */}
                <div style={styles.tableWrapper}>
                    {/* name of each colomn */}
                    <div style={styles.tableHeader}>
                        <span style={{ flex: 1 }}>Date</span>
                        <span style={{ flex: 1 }}>Range</span>
                        <span style={{ flex: 2 }}>Name</span>
                        <span style={{ flex: 1 }}>Action</span>
                    </div>

                    {/* listing each summary we have */}
                    {summaryList.length === 0 ? (
                        <div style={{ padding: "12px 0", fontStyle: "italic", color: "#777" }}>
                            No Summary Records Found
                        </div>
                    ) : (
                        summaryList.map((entry, index) => {
                            const formattedDate =  entry.date?.slice(0, 10); // eg: "2025-06-24T00:00:00" --> 2025-06-24
                            return(
                                <div key={index} style={styles.tableRow}>
                                    <span style={{ flex: 1 }}>{formattedDate}</span>
                                    <span style={{ flex: 1 }}>{entry.range}</span>
                                    <span style={{ flex: 1 }}>{entry.name}</span>
                                    <span style={{ flex: 1 }}><button style={styles.viewBtn}>View</button></span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
//Inline CSS style
const styles = {
    modalOverlay: {
        position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.3)", display: "flex",
        justifyContent: "center", alignItems: "center", zIndex: 5000,
    },
    modalBox: {
        backgroundColor: "#fff", borderRadius: "12px", padding: "28px", maxWidth: "720px", width: "90%", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 4px 20px rgba(0,0,0,0.25)"
    },
    headerBar:{
        display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24,
    },
    closeBtn: {
        background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: "#888",
    },
    pageTitle: {
        fontSize: 22, marginBottom: 24, color: "#222",
    },
    toggleBar: {
        display: "flex", gap: "12px", marginBottom: 20,
    },
    toggleButton: {
        flex: 1, padding: "10px 14px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: 14,
    },
    tableWrapper: {
        border: "1px solid #ccc", borderRadius: "10px", overflow: "hidden", backgroundColor: "#f9f9f9",
    },
    tableHeader: {
        display: "flex", padding: "12px 16px", backgroundColor: "#f0f0f0", fontWeight: "bold", fontSize: 14, borderBottom: "1px solid #ccc"
    },
    tableRow: {
        display: "flex", padding: "10px 16px", borderBottom: "1px solid #e0e0e0", alignItems: "center", fontSize: 14,
    },
    viewBtn: {
        padding: "6px 12px", fontSize: 13, backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer",
    }
}

export default HistorySummary