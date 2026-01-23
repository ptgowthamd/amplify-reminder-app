import { useEffect, useState } from "react";
import { Alert, ThemeProvider } from "@aws-amplify/ui-react";
import { getCurrentUser } from "aws-amplify/auth";
import "./App.css";
import {
  ReminderCreateForm,
  ReminderUpdateForm,
  SocialPostCollection,
  studioTheme,
} from "./ui-components";

function App() {
  const [updateId, setUpdateId] = useState("");
  const [notice, setNotice] = useState(null);
  const [view, setView] = useState("forms");
  const [userSub, setUserSub] = useState("");

  useEffect(() => {
    let isMounted = true;
    getCurrentUser()
      .then((user) => {
        if (isMounted) {
          setUserSub(user.userId);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUserSub("");
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ThemeProvider theme={studioTheme}>
      <div
        style={{
          maxWidth: view === "list" ? 1200 : 720,
          margin: "0 auto",
          padding: 24,
        }}
      >
        <h1>Reminders</h1>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button type="button" onClick={() => setView("forms")}>
            Create/Update reminders
          </button>
          <button type="button" onClick={() => setView("list")}>
            View reminders
          </button>
        </div>

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

        {view === "forms" ? (
          <>
            <section style={{ marginTop: 24 }}>
              <h2>Create Reminder</h2>
              <ReminderCreateForm
                clearOnSuccess
                overrides={{
                  userId: {
                    labelHidden: true,
                    type: "hidden",
                    style: { display: "none" },
                  },
                  stepFnExecutionArn: {
                    labelHidden: true,
                    type: "hidden",
                    style: { display: "none" },
                  },
                }}
                onSubmit={(fields) => ({
                  ...fields,
                  userId: userSub,
                })}
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
                    userId: {
                      labelHidden: true,
                      type: "hidden",
                      style: { display: "none" },
                    },
                    stepFnExecutionArn: {
                      labelHidden: true,
                      type: "hidden",
                      style: { display: "none" },
                    },
                  }}
                  onSubmit={(fields) => ({
                    ...fields,
                    userId: userSub,
                  })}
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
          </>
        ) : (
          <section style={{ marginTop: 24 }}>
            <h2>View Reminders</h2>
            <SocialPostCollection
              templateColumns="repeat(auto-fit, minmax(260px, 1fr))"
              gap="12px"
              alignItems="stretch"
              overrideItems={() => ({
                overrides: {
                  SocialPost: {
                    width: "100%",
                    height: "auto",
                    padding: "16px",
                  },
                },
              })}
            />
          </section>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
