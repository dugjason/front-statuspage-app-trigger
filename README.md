# Front Statuspage App Trigger

This project bridges [Atlassian Statuspage](https://www.atlassian.com/software/statuspage) incident webhooks with [Front](https://front.com), so your team can automatically update incident statuses on conversations inside Front. 
An incoming Statuspage webhook creates or updates a Front Application Object and fires a Front Application Trigger, which you can wire into a rule to keep conversations in sync with your public status site.

## How It Works

1. Atlassian Statuspage sends incident webhooks to this service - use the Subscribe to updates > Webhook Notification option on your status page.
2. When a new incident moves into the `investigating` state, we create a Front Application Object link for the incident URL.
3. Subsequent updates fire Front App Events (`status_updated` or `status_resolved`), which a Front rule reacts to in order to tag, reopen, or comment on matching conversations.

## Requirements

- A Front company instance with permission to create private applications.
- A Front Application configured with:
  - An Application Object that detects your status site URLs (works with Atlassian-hosted Statuspages).
  - Application Triggers that accept `status_updated` and `status_resolved` events.
- Somewhere to host this API endpoint. This demo uses Vercel, but you should be able to modify to run anywhere with minimal effort.
- Environment variables:
  - `FRONT_API_KEY`: Front API token with the **Application Triggers** scope.
  - `FRONT_APP_UID`: UID of your Front application (16 characters).
  - `STATUSPAGE_URL`: Base URL of your public status site (e.g. `https://status.example.com`).

## Configure Front

1. **Create the Application Object** – Follow the Front docs for [Connectors > Application objects](https://dev.frontapp.com/docs/overview-2). Configure the pattern so it matches your Atlassian Statuspage incident URLs (for example `https://status.example.com/incidents/*`).
    - Any time you comment or send/receive messages containing that incident URL, the App Object will automatically get linked to the conversation. 
2. **Add Application Triggers** – In the same app, define Application Triggers for the `status_updated` and `status_resolved` event types. See the [Application Triggers guide](https://dev.frontapp.com/docs/application-triggers) for details on expected payloads.
3. **Build a Rule** – Create a Front rule using the **App event is received** trigger targeting your new Application Trigger. Add whatever actions you need (tag conversations, reopen threads, post comments, etc.) when an incident update arrives.

## Configure Atlassian Statuspage

1. On your status page, click Subscribe to Updates > Webhook Notifications to create or update a webhook subscription that points to your deployed endpoint (for local development see the notes below).

## Local Development
_(Assumes use of Vercel)_
```bash
pnpm install
vercel dev
```

The dev server runs on `http://localhost:3000`. Use a tunneling tool (such as `ngrok`) to expose the `/event` endpoint so Statuspage can reach your local instance.

## Deployment

Set `FRONT_API_KEY`, `FRONT_APP_UID`, and `STATUSPAGE_URL` in your hosting platform before the deployment completes.

Deploy to Vercel (or your preferred host) with the required environment variables:

```bash
pnpm install
vercel deploy
```

## Updating Front Conversations When Incidents Close

Statuspage marks incidents as `resolved` when they finish, and will send a notification to your endpoint.
The service sends a `status_resolved` App Event to Front, which your rule can interpret to clean up tags, post closing comments, reopen or archive conversations automatically. 
Because the Application Object is tied to the incident URL, only conversations referencing that incident are updated.

## Need Help?

- Front Application Triggers documentation: [dev.frontapp.com/docs/application-triggers](https://dev.frontapp.com/docs/application-triggers)
- Front Application Objects overview: [dev.frontapp.com/docs/overview-2](https://dev.frontapp.com/docs/overview-2)
- Front product site: [front.com](https://front.com)
- Contact Front Support: [help.front.com](https://help.front.com/en/contact-us)