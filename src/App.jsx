import React, { useState, useEffect } from "react";
import db from "./config/firebaseApi";
import { collection, getDocs, addDoc, deleteDoc, query, where } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const App = () => {
  const [reservations, setReservations] = useState([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [room, setRoom] = useState("");

  const [jumuiaList, setJumuiaList] = useState([]);
  const [roomList, setRoomList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchReservations();
    fetchJumuiaList();
    fetchRoomList();

    const cleanUp = async () => {
      await removeExpiredReservations();
      fetchReservations();
    };
    cleanUp();

    const interval = setInterval(removeExpiredReservations, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchReservations = async () => {
    try {
      const snapshot = await getDocs(collection(db, "reservations"));
      const data = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setReservations(data);
    } catch (error) {
      toast.error("Error fetching reservations!");
    }
  };

  const fetchJumuiaList = async () => {
    try {
      const snapshot = await getDocs(collection(db, "jumuiaGroups"));
      const data = snapshot.docs.map((doc) => doc.data().name);
      setJumuiaList(data);
    } catch (error) {
      toast.error("Error fetching Jumuia list!");
    }
  };

  const fetchRoomList = async () => {
    try {
      const snapshot = await getDocs(collection(db, "rooms"));
      const data = snapshot.docs.map((doc) => doc.data().name);
      setRoomList(data);
    } catch (error) {
      toast.error("Error fetching Room list!");
    }
  };

  const removeExpiredReservations = async () => {
    const now = new Date();

    try {

      const snapshot = await getDocs(
        query(
          collection(db, "reservations"),
          where("reservationTime", "<", now.toISOString())
        )
      );

      if (snapshot.empty) {
        return;
      }

      snapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      fetchReservations();
    } catch (error) {
      console.error("Error removing expired reservations: ", error);
    }
  };

  const isExpired = (reservationTime) => {
    const now = new Date();
    const reservationDate = new Date(reservationTime);
    return reservationDate < now;
  };

  const isRoomAvailable = (room, date, time) => {
    return !reservations.some(
      (reservation) =>
        reservation.room === room &&
        reservation.date === date &&
        reservation.time === time
    );
  };

  const isJumuiaAllowedToReserve = (jumuiaName, date) => {
    return !reservations.some(
      (reservation) =>
        reservation.name === jumuiaName && reservation.date === date && !isExpired(reservation.reservationTime)
    );
  };

  const handleReserveRoom = async () => {
    if (!name || !date || !time || !room) {
      toast.error("All fields must be filled out!");
      return;
    }

    // Check if the Jumuia already has a reservation for the same day
    if (!isJumuiaAllowedToReserve(name, date)) {
      toast.error("This Jumuia already has a reservation for today.");
      return;
    }

    // Check if the room is already reserved at the selected time
    if (!isRoomAvailable(room, date, time)) {
      toast.error("Room is already reserved at this time.");
      return;
    }

    try {
      // Add the reservation to Firebase
      await addDoc(collection(db, "reservations"), {
        name,
        date,
        time,
        room,
        reservationTime: new Date(`${date}T${time}`).toISOString(),
      });

      toast.success("Room reserved successfully!");
      fetchReservations(); // Refresh the list of reservations
    } catch (error) {
      toast.error("Error reserving room.");
    }
  };

  const generateTimeSlots = () => {
    let timeSlots = [];
    let startTime = new Date();
    for (let i = 0; i < 24; i++) {
      let timeSlot = new Date(startTime);
      timeSlot.setHours(startTime.getHours() + i);
      const hours = timeSlot.getHours().toString().padStart(2, "0");
      timeSlots.push(`${hours}:00`);
    }
    return timeSlots;
  };

  const filteredReservations = reservations.filter(
    (reservation) =>
      reservation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.date.includes(searchTerm)
  );

  return (
    <div className="rounded">
      <div className="p-6 max-w-xl mx-auto h-screen overflow-scroll">
        <h2 className="text-2xl font-bold text-center underline uppercase">St.Peter Claver's</h2>
        <h4 className="text-2xl font-bold mb-4">Jumuia Meeting Reservations</h4>

        <div className="mb-4">
          <Select
            className="mb-4"
            options={jumuiaList.map((jumuia) => ({ label: jumuia, value: jumuia }))}
            onChange={(selectedOption) => setName(selectedOption ? selectedOption.value : "")}
            placeholder="Select Jumuia"
            value={name ? { label: name, value: name } : null}
          />

          <select
            className="border p-2 w-full mt-2 rounded"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          >
            <option value="" disabled>Select Time</option>
            {generateTimeSlots().map((timeSlot, index) => (
              <option key={index} value={timeSlot}>
                {timeSlot}
              </option>
            ))}
          </select>

          <select
            className="border p-2 w-full mt-2 rounded"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          >
            <option value="" disabled>Select Room</option>
            {roomList.map((room, index) => (
              <option key={index} value={room}>
                {room}
              </option>
            ))}
          </select>

          <DatePicker
            className="border p-2 w-full mt-2 rounded"
            selected={date ? new Date(date) : null}
            onChange={(date) => setDate(date ? date.toLocaleDateString("en-CA") : "")}
            minDate={new Date()}
            dateFormat="yyyy-MM-dd"
            placeholderText="Select a date" />


          <button
            className="bg-blue-500 text-white p-2 mt-2 w-full rounded"
            onClick={handleReserveRoom}
          >
            Reserve Room
          </button>
        </div>

        <h2 className="text-xl font-semibold mb-2 mt-4 underline">Current Reservations</h2>
        <input
          className="border p-2 w-full mt-2 mb-2 rounded"
          type="text"
          placeholder="Search by Jumuia, room, or date..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <ul>
          {filteredReservations.length > 0 ? (
            filteredReservations.map((reservation, index) => (
              <li key={index} className="border p-2 mb-2 rounded">
                <strong>{reservation.name}</strong> -{" "}
                {new Date(reservation.reservationTime).toLocaleString()} - Room{" "}
                {reservation.room}
              </li>
            ))
          ) : (
            <p className="text-gray-500">No reservations found.</p>
          )}
        </ul>

        <ToastContainer />
      </div>
      <footer className="mt-6 p-4 text-center border-t">
        <p className="text-gray-600">
          Chat with the developer{" "}
          <a
            href="https://wa.me/254795360391"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-500 font-semibold"
          >
            WhatsApp
          </a>
          .
        </p>
      </footer>
    </div>
  );
};

export default App;
