import express from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import routes from './app/routes/routes';
import HttpException from './app/models/http-exception.model';

const app = express();

/**
 * App Configuration
 */

// Explicitly allow your frontend port
app.use(cors({
  origin: 'http://localhost:8081',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));

// Fixed: Using the correct variable name 'bodyParser'
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(routes);

// Serves images
app.use(express.static(__dirname + '/assets'));

app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ status: 'API is running on /api' });
});

/* eslint-disable */
// UPDATED GLOBAL ERROR HANDLER
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    // 1. Force the error to print to your logs (visible in kubectl logs)
    console.error("!!! DETECTED ERROR !!!");
    console.error("URL:", req.url);
    console.error(err);

    // 2. Handle errors and send feedback to the browser
    if (err && err.name === 'UnauthorizedError') {
      return res.status(401).json({
        status: 'error',
        message: 'missing authorization credentials',
      });
    } else if (err && err.errorCode) {
      res.status(err.errorCode).json({ message: err.message });
    } else {
      // 3. Send the stack trace to the browser so you can identify the file/line
      res.status(500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
        stack: err.stack, 
      });
    }
  },
);

/**
 * Server activation
 */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.info(`server up on port ${PORT}`);
});
