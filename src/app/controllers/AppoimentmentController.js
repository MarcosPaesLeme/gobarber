import * as Yup from 'yup';
import { startOfHour, isBefore, parseISO, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notification';
import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/CancellationMail';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const appointments = await Appointment.findAll({
      where: {
        user_id: req.userId,
        canceled_at: null,
      },
      attributes: ['id', 'date', 'past', 'cancelable'],
      order: ['date'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'url', 'path'],
            },
          ],
        },
      ],
    });

    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ error: 'Validation fails!' });

    const { provider_id, date } = req.body;

    /*
      Check if provider_id is a provider
    */

    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider)
      return res
        .status(401)
        .json({ error: 'You can only create appointments with provider' });

    const hourOfStart = startOfHour(parseISO(date));
    /**
     * Check for past dates
     */
    if (isBefore(hourOfStart, new Date()))
      return res.status(400).json({ error: 'Past dates are not permitted' });

    /**
     * Check date availabity
     */

    const checkavailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourOfStart,
      },
    });

    if (checkavailability)
      return res
        .status(400)
        .json({ error: 'Appointment date is not available' });

    const appoimentment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date: hourOfStart,
    });

    /**
     * Notify appoimentment provider
     */

    const user = await User.findByPk(req.userId);
    const formattedDate = format(
      hourOfStart,
      "'dia' dd 'de' MMMM', ás' H:mm'h'",
      { locale: pt }
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`,
      user: provider_id,
    });

    return res.json(appoimentment);
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    if (appointment.user_id !== req.userId)
      return res.status(401).json({
        error: 'You do not have permission to cancel this appointment.',
      });

    const dateWithSub = subHours(appointment.date, 2);

    if (isBefore(dateWithSub, new Date()))
      return res.status(401).json({
        error: 'You can only cancel appointment 2 hours in advance.',
      });

    appointment.canceled_at = new Date();

    await appointment.save();

    Queue.add(CancellationMail.key, {
      appointment,
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
