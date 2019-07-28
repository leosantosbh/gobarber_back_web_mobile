// biblioteca de envio para imagem
import multer from 'multer';

// bibloteca node para gerar um codigo unico "uma sequencia aleatória"
import crypto from 'crypto';

// import path "extname" para extenção e "resolve" para percorrer as pastas da aplicação
import { extname, resolve } from 'path';

export default {
   // storage como o multer guarda as imagens (pasta criada) "diskStorage"
   storage: multer.diskStorage({
      // local onde será salvo
      destination: resolve(__dirname, '..', '..', 'temp', 'uploads'),

      // cria o arquivo para salvar com o multer "cb" callback
      filename: (req, file, cb) => {
         // "randomBytes" é usado para gerar uma chave para cada imagem (para nao ocorerr duplicidade)
         crypto.randomBytes(16, (err, res) => {
            // se erro retorna "cb" com erro
            if (err) return cb(err);
            // se não "cb" com o nome do arquivo gerado "res.toString vem de crypto.randomBytes" e gera um "hex" hexadecimal
            return cb(null, res.toString('hex') + extname(file.originalname));
         });
      },
   }),
};
