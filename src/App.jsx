import { useState } from "react";
import { Alert, ThemeProvider } from "@aws-amplify/ui-react";
import "./App.css";
import {
  ReminderCreateForm,
  ReminderUpdateForm,
  studioTheme,
} from "./ui-components";

function App() {
  const [updateId, setUpdateId] = useState("");
  const [notice, setNotice] = useState(null);

  return (
    <ThemeProvider theme={studioTheme}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
        <h1>Reminders</h1>

        {notice && (
          <Alert
            variation={notice.type}
            isDismissible
            onDismiss={() => setNotice(null)}
            style={{ marginTop: 16 }}
          >
            {notice.text}
          </Alert>
        )}

        <section style={{ marginTop: 24 }}>
          <h2>Create Reminder</h2>
          <ReminderCreateForm
            clearOnSuccess
            overrides={{
              stepFnExecutionArn: {
                labelHidden: true,
                type: "hidden",
                style: { display: "none" },
              },
            }}
            onSuccess={() =>
              setNotice({ type: "success", text: "Reminder created." })
            }
            onError={(_, errorMessage) =>
              setNotice({
                type: "error",
                text: `Create failed: ${errorMessage}`,
              })
            }
          />
        </section>

        <section style={{ marginTop: 32 }}>
          <h2>Update Reminder</h2>
          <input
            type="text"
            placeholder="Paste reminder id to edit"
            value={updateId}
            onChange={(event) => setUpdateId(event.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 16 }}
          />
          {updateId ? (
            <ReminderUpdateForm
              id={updateId}
              overrides={{
                stepFnExecutionArn: {
                  labelHidden: true,
                  type: "hidden",
                  style: { display: "none" },
                },
              }}
              onSuccess={() =>
                setNotice({ type: "success", text: "Reminder updated." })
              }
              onError={(_, errorMessage) =>
                setNotice({
                  type: "error",
                  text: `Update failed: ${errorMessage}`,
                })
              }
            />
          ) : (
            <p>Enter a reminder id to load the update form.</p>
          )}
        </section>
      </div>
    </ThemeProvider>
  );
}

export default App;
