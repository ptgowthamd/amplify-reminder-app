import { useEffect, useState } from "react";
import {
  Alert,
  Authenticator,
  CheckboxField,
  ThemeProvider,
  useAuthenticator,
} from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/api";
import "./App.css";
import {
  ReminderCreateForm,
  ReminderUpdateForm,
  SocialPostCollection,
  studioTheme,
} from "./ui-components";

const client = generateClient();
const listRemindersQuery = /* GraphQL */ `
  query ListReminders($filter: ModelReminderFilterInput, $limit: Int) {
    listReminders(filter: $filter, limit: $limit) {
      items {
        id
        userId
        title
        description
        remindAt
        stepFnExecutionArn
      }
    }
  }
`;

const validateRemindAt = (value, validationResponse) => {
  if (validationResponse.hasError || !value) {
    return validationResponse;
  }
  const remindDate = new Date(value);
  if (Number.isNaN(remindDate.getTime())) {
    return {
      hasError: true,
      errorMessage: "Enter a valid reminder date and time.",
    };
  }
  const now = new Date();
  now.setSeconds(0, 0);
  if (remindDate.getTime() < now.getTime()) {
    return {
      hasError: true,
      errorMessage: "Remind at cannot be in the past.",
    };
  }
  const oneYearFromNow = new Date(now);
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  if (remindDate.getTime() > oneYearFromNow.getTime()) {
    return {
      hasError: true,
      errorMessage: "Remind at must be within 1 year from now.",
    };
  }
  return validationResponse;
};

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
  const [refreshKey, setRefreshKey] = useState(0);

  const formatLocalDateTime = (value) => {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  useEffect(() => {
    if (!userSub || view !== "list") {
      setUserReminders([]);
      return;
    }
    let isActive = true;

    const fetchReminders = async () => {
      try {
        const result = await client.graphql({
          query: listRemindersQuery,
          variables: {
            filter: { userId: { eq: userSub } },
            limit: 100,
          },
        });
        if (isActive) {
          setUserReminders(result?.data?.listReminders?.items ?? []);
        }
      } catch (error) {
        if (isActive) {
          setNotice({
            type: "error",
            text: "Failed to load reminders.",
          });
        }
      }
    };

    fetchReminders();

    return () => {
      isActive = false;
    };
  }, [userSub, view, refreshKey]);

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
                  remindAt: validateRemindAt,
                }}
                onSuccess={() => {
                  setNotice({ type: "success", text: "Reminder created." });
                  setRefreshKey((value) => value + 1);
                }}
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
                    remindAt: validateRemindAt,
                  }}
                  onSuccess={() => {
                    setNotice({
                      type: "success",
                      text: "Reminder updated.",
                    });
                    setRefreshKey((value) => value + 1);
                  }}
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
              overrideItems={({ item }) => ({
                overrides: {
                  SocialPost: {
                    width: "100%",
                    height: "auto",
                    padding: "16px",
                  },
                  "2nd December 2022": {
                    children: formatLocalDateTime(item?.remindAt),
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
