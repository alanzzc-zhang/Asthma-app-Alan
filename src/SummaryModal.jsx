import React, {useState, useEffect} from "react";
import SummaryReport from "./SummaryReport";
import { act } from "react";

function SummaryModal({onClose}) {
    const [isProcessing, setIsProcessing] = useState(false);//showing a processing modal when LLM is working(currently it's just 10 sec for testing)
    const [summaryShown, setSummaryShown] = useState(false); // Whether to show summary result

    useEffect(() => {
        let timer;
        if (isProcessing) {
        timer = setTimeout(() => {
            setIsProcessing(false);
            setSummaryShown(true); // show report
        }, 10000); // mimic a 10 sec processing modal
        }
        return () => clearTimeout(timer);
    }, [isProcessing, onClose]);

    return(
    <>
    {summaryShown ? (
      <div style={styles.modalOverlay}>
        <SummaryReport onClose={onClose} />
      </div>
    ):(
      <>
      {/* If processing, then showing the processing modal. if not, showing the selection modal */}
      {!isProcessing ? (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <button style={styles.closeBtn} onClick={onClose}>
              X
            </button>
            <h2 style={styles.title}>Please select the type of summary you want to generate.</h2>
            <p style={styles.text}>
              The system will generate a personalized summary based on your selected time range (e.g., the past 7 days).
            </p>
            <button style={styles.actionBtn} onClick={() => setIsProcessing(true)}>
              Personal Summary
            </button>
            <button style={styles.actionBtn} onClick={() => setIsProcessing(true)}>
              Doctor-Faced Summary
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.processingOverlay}>
          <div style={styles.processingBox}>
            <div style={styles.spinner}></div>
            <p>Generating summary...</p>
          </div>
        </div>
      )}
      </>
    )//end of : (...)
    }
    </>//end of outer <></>
  )//end of return

}

export default SummaryModal;

const styles = {
    modalOverlay:{
        position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 5000,
    },
    modal:{
        background: "white", padding: "24px", borderRadius: "12px", width: "90%", maxWidth: "400px", position: "relative", textAlign: "center",
    },
    closeBtn:{
        position: "absolute", top: "8px", right: "12px", background: "transparent", border: "none", fontSize: "24px", cursor: "pointer",
    },
    actionBtn:{
        marginTop: "20px", padding: "10px 20px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "8px", cursor: "pointer",
    },
    title:{
        marginBottom: "10px",
    },
    text:{
        fontSize: "14px",
        color: "#333",
    },
    processingOverlay:{
        position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(255,255,255,0.8)", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 5001,
    },
    processingBox:{
        textAlign: "center", fontSize: "18px",
    },
    spinner:{
        margin: "0 auto 12px", width: "32px", height: "32px", border: "4px solid #ccc", borderTop: "4px solid #007bff",
        borderRadius: "50%", animation: "spin 1s linear infinite",
    },
    // Spinner animation manually added below
    "@keyframes spin": {
        to: {
        transform: "rotate(360deg)",
        },
    },
}