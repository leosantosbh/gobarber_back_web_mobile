import * as Yup from 'yup';
import {
   startOfHour,
   parseISO,
   isBefore,
   format,
   subHours,
   setMinutes,
   setSeconds,
} from 'date-fns';
import pt from 'date-fns/locale/pt-BR';
import User from '../models/User';
import File from '../models/File';
import Appointment from '../models/Appointment';
import Notification from '../schemas/Notification';

import CancellationMail from '../jobs/CancellationMail';
import Queue from '../../lib/Queue';

class AppointController {
   async index(req, res) {
      const { page = 1 } = req.query;

      const appointments = await Appointment.findAll({
         where: { user_id: req.userId, canceled_at: null },
         order: ['date'],
         attributes: ['id', 'date', 'past', 'cancelable'],
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
                     attributes: ['id', 'path', 'url'],
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

      if (!(await schema.isValid(req.body))) {
         return res.status(400).json({ error: 'Validation fails' });
      }

      const { provider_id, date } = req.body;

      // Checa se usuário é provider
      const isProvider = await User.findOne({
         where: {
            id: provider_id,
            provider: true,
         },
      });
      // valida se usuario q vai receber a marcação é provider
      if (req.userId === provider_id) {
         return res
            .status(400)
            .json({ error: 'Não é possivel agendar com você mesmo' });
      }

      if (!isProvider) {
         return res.status(400).json({ error: 'Usuário não é um provedor' });
      }

      const hourStart = startOfHour(parseISO(date));
      // valida se a hora da marcação ja passou
      if (isBefore(hourStart, new Date())) {
         return res.status(400).json({ error: 'date not permited' });
      }

      // valida o horário é disponível

      const checkDate = await Appointment.findOne({
         where: {
            provider_id,
            canceled_at: null,
            date: hourStart,
         },
      });

      if (checkDate) {
         return res
            .status(400)
            .json({ error: 'Appoint date is not available' });
      }

      const dateFormatted = setSeconds(setMinutes(parseISO(date), 0), 0);

      const appoint = await Appointment.create({
         user_id: req.userId,
         provider_id,
         date: dateFormatted,
      });

      const user = await User.findByPk(req.userId);

      const fomatedDate = format(hourStart, "'dia' dd 'de' MMM', às' H:mm'h'", {
         locale: pt,
      });

      // notificar prestador
      await Notification.create({
         content: `Novo agendamento de ${user.name} para o ${fomatedDate}`,
         user: provider_id,
      });

      return res.json(appoint);
   }

   async delete(req, res) {
      const appoint = await Appointment.findByPk(req.params.id, {
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

      if (appoint.user_id !== req.userId) {
         return res.status(401).json({
            error: "You don't have permission to cancel this appointment",
         });
      }

      const dateWithSub = subHours(appoint.date, 2);

      if (isBefore(dateWithSub, new Date())) {
         return res.status(401).json({
            error: 'You can only cancel appointments 2 hours in advance.',
         });
      }

      appoint.canceled_at = new Date();

      await appoint.save();

      await Queue.add(CancellationMail.key, {
         appoint,
      });

      return res.json(appoint);
   }
}

export default new AppointController();
