import "dotenv/config";
import { app } from "./app";
import { AppDataSource } from "./config/data-source";

const PORT = process.env.PORT ?? 3000;

AppDataSource.initialize()
  .then(() => {
    console.log(`Conectado a la base de datos (${process.env.DB_NAME})`);
    app.listen(PORT, () => {
      console.log(`API escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error al conectar con la base de datos:", error);
    process.exit(1);
  });
