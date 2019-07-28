import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

// import controle de usuário (criar e atualizar)
import UserController from './app/controllers/UserController';

// import controle de sessão
import SessionController from './app/controllers/SessionController';

// import controle de arquivo
import FileController from './app/controllers/FileController';

// import providers
import ProviderController from './app/controllers/ProviderController';

// import Marca agenda
import AppointController from './app/controllers/AppointController';
// import schedule agenda
import ScheduleController from './app/controllers/ScheduleController';
// import notificações
import NotificationController from './app/controllers/NotificationController';

import AvailableController from './app/controllers/AvailableController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
// variavem para upload
const upload = multer(multerConfig);

// rotas para criar usuário e gerar sessão
routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

routes.use(authMiddleware);
// rota para atualizar usuário
routes.put('/users', UserController.update);

// lista provedores
routes.get('/providers', ProviderController.index);
routes.get('/providers/:id/available', AvailableController.index);

// rota para agendamento
routes.post('/appointments', AppointController.store);
// lista agendamento cliente
routes.get('/appointments', AppointController.index);
// deleta agendamento cliente
routes.delete('/appointments/:id', AppointController.delete);

// lista agenda provider
routes.get('/schedule', ScheduleController.index);
// rota para realizar upload do arquivo "foto" do multer (filecontroller)

routes.get('/notifications', NotificationController.index);
routes.put('/notifications/:id', NotificationController.update);

routes.post('/files', upload.single('file'), FileController.store);

export default routes;
