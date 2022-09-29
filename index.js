const express = require("express");
const app = express();
const { createServer } = require("http");
const server = createServer(app);
const session = require("express-session");
const port = 8080;
const bodyParser = require("body-parser");
require('dotenv').config();
const cors = require("cors");

app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: "SECRET",
  })
);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

app.get("/api/oauthcallback", (req, res) => {
  console.log(req);
});

app.post("/api/add-event", (req, res) => {
  const user = JSON.parse(req.body.user);
  const data = JSON.parse(req.body.formData);
  // const credentials = JSON.parse(req.body.credentials);
  // const tok = req.body.token;

  oauth2Client.setCredentials({
    access_token: user.stsTokenManager.accessToken,
    refresh_token: user.stsTokenManager.refreshToken,
    expiry_date: user.stsTokenManager.expirationTime,
    scope: "https://www.googleapis.com/auth/calendar",
  });

  const calendar = google.calendar({ version: "v3", oauth2Client });

  const event = {
    summary: data.title,
    description: data.description,
    location: data.location,
    start: { dateTime: data.start, timeZone: "America/Recife" },
    end: { dateTime: data.end, timeZone: "America/Recife" },
    role: "writer",
    // recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=MO;WKST=SU;UNTIL=20221025T025959Z"],
  };

  calendar.events.insert({
    auth: oauth2Client,
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    resource: event,
  }).then((event) => console.log('event created: %s', event.htmlLink))
    .catch((error) => console.log('Some error occured', error));
});

server.listen(port, () => console.log(`listening on port ${port}`));
