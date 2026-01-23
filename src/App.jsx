import { useEffect, useState } from "react";
import {
  Alert,
  Authenticator,
  CheckboxField,
  ThemeProvider,
  useAuthenticator,
} from "@aws-amplify/ui-react";
import { DataStore } from "aws-amplify/datastore";
import "./App.css";
import {
  ReminderCreateForm,
  ReminderUpdateForm,
  SocialPostCollection,
  studioTheme,
} from "./ui-components";
import { Reminder } from "./models";

function SignUpFormFields() {
  const { validationErrors } = useAuthenticator();

  return (
    <>
      <Authenticator.SignUp.FormFields />
      <CheckboxField
        errorMessage={validationErrors.acknowledgement}
        hasError={!!validationErrors.acknowledgement}
        name="acknowledgement"
        value="yes"
        label="I agree with the Terms & Conditions"
      />
    </>
  );
}

function ReminderApp({ userSub, onSignOut }) {
  const [updateId, setUpdateId] = useState("");
  const [notice, setNotice] = useState(null);
  const [view, setView] = useState("forms");
  const [userReminders, setUserReminders] = useState([]);

  useEffect(() => {
    if (!userSub) {
      setUserReminders([]);
      return undefined;
    }
    const subscription = DataStore.observeQuery(Reminder, (r) =>
      r.userId.eq(userSub)
    ).subscribe(({ items }) => {
      setUserReminders(items);
    });

    return () => subscription.unsubscribe();
  }, [userSub]);

  return (
    <ThemeProvider theme={studioTheme}>
      <div
        style={{
          maxWidth: view === "list" ? 1200 : 720,
          margin: "0 auto",
          padding: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ margin: 0, flex: 1 }}>Reminders</h1>
          <button type="button" onClick={onSignOut}>
            Sign out
          </button>
        </div>

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
                onChange={(fields) => ({
                  ...fields,
                  userId: userSub,
                })}
                onSubmit={(fields) => ({
                  ...fields,
                  userId: userSub,
                })}
                onValidate={{
                  userId: (value, validationResponse) =>
                    userSub ? { hasError: false } : validationResponse,
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
                  onChange={(fields) => ({
                    ...fields,
                    userId: userSub,
                  })}
                  onSubmit={(fields) => ({
                    ...fields,
                    userId: userSub,
                  })}
                  onValidate={{
                    userId: (value, validationResponse) =>
                      userSub ? { hasError: false } : validationResponse,
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
          </>
        ) : (
          <section style={{ marginTop: 24 }}>
            <h2>View Reminders</h2>
            <SocialPostCollection
              items={userReminders}
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

export default function App() {
  return (
    <Authenticator
      initialState="signUp"
      components={{
        SignUp: {
          FormFields: SignUpFormFields,
        },
      }}
      services={{
        async validateCustomSignUp(formData) {
          if (!formData.acknowledgement) {
            return {
              acknowledgement: "You must agree to the Terms & Conditions",
            };
          }
        },
      }}
    >
      {({ signOut, user }) => (
        <ReminderApp
          userSub={user?.userId ?? user?.attributes?.sub ?? ""}
          onSignOut={signOut}
        />
      )}
    </Authenticator>
  );
}
