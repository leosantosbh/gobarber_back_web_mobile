import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt-BR';
import Mail from '../../lib/Mail';

class CancellationMail {
   get key() {
      return 'CancellationMail';
   }

   async handle({ data }) {
      const { appoint } = data;

      await Mail.sendMail({
         to: `${appoint.provider.name} <${appoint.provider.email}>`,
         subject: 'Agendamento Cancelado',
         template: 'cancellation',
         context: {
            provider: appoint.provider.name,
            user: appoint.user.name,
            date: format(
               parseISO(appoint.date),
               "'dia' dd 'de' MMM', às' H:mm'h'",
               {
                  locale: pt,
               }
            ),
         },
      });
   }
}

export default new CancellationMail();
