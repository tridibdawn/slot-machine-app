import React, { useState, useEffect } from "react";
import axios from "axios";
import "./SlotMachine.css";

function SlotMachine() {
  const [credits, setCredits] = useState(null); // Initialize with null to check on mount
  const [slots, setSlots] = useState(["X", "X", "X"]);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState("");

  // On component mount, start a session only if credits are null
  useEffect(() => {
    if (credits === null) {
      // Only start session if credits are null (session not started yet)
      axios
        .get("http://localhost:3001/start-session", { withCredentials: true })
        .then((response) => {
          setCredits(response.data.credits); // Set credits from response
        })
        .catch((error) => {
          console.error("Error starting session", error);
        });
    }
  }, [credits]); // Only run effect when credits change

  const rollSlots = () => {
    if (spinning || credits <= 0) return; // Prevent rolling if spinning or out of credits

    setSpinning(true);
    setMessage("Rolling...");

    axios
      .get("http://localhost:3001/roll", { withCredentials: true })
      .then((response) => {
        const { slots, credits, win, message } = response.data;

        if (credits <= 0) {
          if (!message) {
            setMessage("No credits left");
          } else {
            setMessage(message);
          }
          setSpinning(false);
          setCredits(credits);
          return; // Exit early since no more credits
        }

        // Simulate slot spinning with delays
        setTimeout(() => setSlots([slots[0], "X", "X"]), 1000);
        setTimeout(() => setSlots([slots[0], slots[1], "X"]), 2000);
        setTimeout(() => {
          setSlots(slots);
          setCredits(credits); // Update credits with new value
          setSpinning(false);
          setMessage(win ? "You won!" : "You lost!");
        }, 3000);
      })
      .catch((error) => {
        console.error("Error during roll", error);
        setSpinning(false);
        setMessage("Error during roll");
      });
  };

  const cashOut = () => {
    axios
      .get("http://localhost:3001/cash-out", { withCredentials: true })
      .then((response) => {
        alert(response.data.message);
        setCredits(null); // Reset credits after cash out
      })
      .catch((error) => {
        console.error("Error cashing out", error);
      });
  };

  const resetGame = () => {
    axios
      .get("http://localhost:3001/reset-session", { withCredentials: true })
      .then((response) => {
        setSlots(["X", "X", "X"]); // Reset slots to initial state
        setCredits(response.data.credits); // Reset credits to 10
        setMessage("");
      })
      .catch((error) => {
        console.error("Error resetting game", error);
      });
  };

  return (
    <div className="slot-machine">
      <h1>Slot Machine</h1>
      <div className="slot-wrapper">
        {slots.map((slot, index) => (
          <span key={`slot-item-${index}`} className="slot-item">
            {slot}
          </span>
        ))}
      </div>
      <p>Credits: {credits !== null ? credits : "Loading..."}</p>
      {message ? <p>{message}</p> : null}
      <div className="btn-container">
        <button onClick={rollSlots} disabled={spinning || credits <= 0}>
          ROLL
        </button>
        <button onClick={cashOut} disabled={spinning || credits <= 0}>
          CASH OUT
        </button>
        <button onClick={resetGame}>RESET</button> {/* Added RESET button */}
      </div>
    </div>
  );
}

export default SlotMachine;
