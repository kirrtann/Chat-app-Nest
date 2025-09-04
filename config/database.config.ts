// import { DataSource, DataSourceOptions } from 'typeorm';
// import { configuration } from './configuration';

// export const dataSourceOptions: DataSourceOptions = {
//   type: 'postgres',
//   host: configuration().DB_HOST,
//   port: Number(configuration().DB_PORT),
//   username: configuration().DB_USERNAME,
//   password: configuration().DB_PASSWORD,
//   database: configuration().DB_NAME,
//   synchronize: false,
//   logging: true,
//   ssl: process.env.POSTGRES_SSL
//     ? {
//         rejectUnauthorized: false,
//       }
//     : false,
//   entities: ['dist/**/*.entity.js'],
//   migrations: ['dist/src/migrations/*.js'],
// };

// const dataSource = new DataSource(dataSourceOptions);
// export default dataSource;
