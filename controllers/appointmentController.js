const AppointmentModel = require('../models/appointmentModel');

const AppointmentController = {
    async create(req, res) {
        try {
            const userId = req.user.userId;
            const { date, time } = req.body;
            if (!date || !time) {
                return res.status(400).json({ success: false, message: 'Date and time are required.' });
            }
            const result = await AppointmentModel.createAppointment(userId, date, time);
            if (result.success) {
                res.status(201).json({ success: true, appointment: result.appointment });
            } else {
                res.status(500).json({ success: false, message: result.error });
            }
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async update(req, res) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const { date, time } = req.body;
            if (!date || !time) {
                return res.status(400).json({ success: false, message: 'Date and time are required.' });
            }
            const result = await AppointmentModel.updateAppointment(id, userId, date, time);
            if (result.success) {
                res.json({ success: true, appointment: result.appointment });
            } else {
                res.status(500).json({ success: false, message: result.error });
            }
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async delete(req, res) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const result = await AppointmentModel.deleteAppointment(id, userId);
            if (result.success) {
                res.json({ success: true });
            } else {
                res.status(500).json({ success: false, message: result.error });
            }
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
    async list(req, res) {
        try {
            const userId = req.user.userId;
            const result = await AppointmentModel.listAppointments(userId);
            if (result.success) {
                res.json({ success: true, appointments: result.appointments });
            } else {
                res.status(500).json({ success: false, message: result.error });
            }
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
};

module.exports = AppointmentController; 