import { File as MulterFile } from 'multer'

declare module 'express-serve-static-core' {
  interface Request {
    files: MulterFile[]
  }
}
