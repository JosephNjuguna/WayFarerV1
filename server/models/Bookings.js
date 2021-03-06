/* eslint-disable no-plusplus */
import date from '../helpers/Date';
import Db from '../Db/Db';

class Bookings {
	constructor(payload = null) {
		this.payload = payload;
		this.result = null;
	}

	async bookaSeat() {
		const tripInfo = parseInt(this.payload.tripId, 10);
		const seatNo = parseInt(this.payload.seatNumber, 10);
		const obj = `SELECT *  FROM trips WHERE id = '${tripInfo}'`;
		const { rows } = await Db.query(obj);
		if (rows.length === 0) {
			this.result = { status: 404, message: `Trip Id : ${tripInfo} is not available` };
			return false;
		}
		if (rows[0].status === 'canceled') {
			this.result = { status: 400, message: `Cancelled. Trip Id : ${tripInfo} is cancelled and not available.` };
			return false;
		}
		const trip = [];
		trip.push(rows[0]);
		if (seatNo > rows[0].seatingcapacity || seatNo <= 0) {
			this.result = { status: 400, message: `Please select seat number less than ${rows[0].seatingcapacity} and not 0` };
			return false;
		}
		if (new Date(rows[0].tripdate) < new Date(date.modernDate())) {
			this.result = { status: 400, message: `Please select a current trip. this trip already happened on date ${rows[0].tripdate}.` };
			return false;
		} else {
			const sql = `SELECT * FROM bookings WHERE tripId ='${tripInfo}' AND seatnumber = '${seatNo}'`;
			const { rows } = await Db.query(sql);
			if (rows.length > 0) {
				const bookedSeats = [];
				const availableSeats = [];
				const sqlSeats = `SELECT *  FROM bookings WHERE tripId ='${tripInfo}'`;
				const { rows } = await Db.query(sqlSeats);
				if (rows.length > 0) {
					for (let i = 0; i < rows.length; i++) {
						bookedSeats.push(rows[i].seatnumber);
					}
					for (let i = 1; i <= trip[0].seatingcapacity; i++) {
						if (!bookedSeats.includes(i)) {
							availableSeats.push(i);
						}
					}
				}
				this.result = { status: 404, message: `Seat number : '${seatNo}' already taken. here are the available seats '${availableSeats}` };
				return false;
			} else {
				const values = [tripInfo, this.payload.id, trip[0].buslicensenumber, trip[0].tripdate, this.payload.firstname, this.payload.lastname, this.payload.email, seatNo];
				const sql2 = 'INSERT INTO bookings (tripid, userid, buslicensenumber, tripdate, firstname, lastname, email, seatnumber ) VALUES($1, $2, $3, $4, $5, $6, $7, $8) returning *';
				const { rows } = await Db.query(sql2, values);
				this.result = rows;
				return true;
			}
		}
	}

	async userAllBooking() {
		const sql = `SELECT * FROM bookings WHERE email = '${this.payload.email}'`;
		const { rows } = await Db.query(sql);
		if (rows.length === 0) {
			this.result = 'Sorry you have no booking records yet.';
			return false;
		}
		this.result = rows;
		return true;
	}

	static async viewAllBooking() {
		const sql = 'SELECT *  FROM bookings';
		const { rows } = await Db.query(sql);
		if (rows.length === 0) {
			return false;
		}
		this.result = rows;
		return this.result;
	}

	async deleteBooking() {
		const id = parseInt(this.payload.bookId, 10);
		const obj = `SELECT *  FROM bookings WHERE id = '${id}'`;
		const { rows } = await Db.query(obj);
		if (rows.length === 0) {
			this.result = { status: 404, message: `Booking Id : ${id} is not available` };
			return false;
		} else {
			const sql2 = `DELETE FROM bookings WHERE id ='${id}' AND email = '${this.payload.email}'`;
			const { rows } = await Db.query(sql2);
			if (!rows) {
				this.result = { status: 401, message: 'You are not allowed to delete this booking.' };
				return false;
			}
			this.result = { status: 200, message: 'You have successfully deletes this booking.' };
			return true;
		}
	}
}

export default Bookings;
