/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import { Button, Flex, Grid, TextField } from "@aws-amplify/ui-react";
import { Reminder } from "../models";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { DataStore } from "aws-amplify/datastore";
export default function ReminderUpdateForm(props) {
  const {
    id: idProp,
    reminder: reminderModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    userId: "",
    title: "",
    description: "",
    remindAt: "",
    stepFnExecutionArn: "",
  };
  const [userId, setUserId] = React.useState(initialValues.userId);
  const [title, setTitle] = React.useState(initialValues.title);
  const [description, setDescription] = React.useState(
    initialValues.description
  );
  const [remindAt, setRemindAt] = React.useState(initialValues.remindAt);
  const [stepFnExecutionArn, setStepFnExecutionArn] = React.useState(
    initialValues.stepFnExecutionArn
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = reminderRecord
      ? { ...initialValues, ...reminderRecord }
      : initialValues;
    setUserId(cleanValues.userId);
    setTitle(cleanValues.title);
    setDescription(cleanValues.description);
    setRemindAt(cleanValues.remindAt);
    setStepFnExecutionArn(cleanValues.stepFnExecutionArn);
    setErrors({});
  };
  const [reminderRecord, setReminderRecord] = React.useState(reminderModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(Reminder, idProp)
        : reminderModelProp;
      setReminderRecord(record);
    };
    queryData();
  }, [idProp, reminderModelProp]);
  React.useEffect(resetStateValues, [reminderRecord]);
  const validations = {
    userId: [{ type: "Required" }],
    title: [{ type: "Required" }],
    description: [{ type: "Required" }],
    remindAt: [{ type: "Required" }],
    stepFnExecutionArn: [],
  };
  const runValidationTasks = async (
    fieldName,
    currentValue,
    getDisplayValue
  ) => {
    const value =
      currentValue && getDisplayValue
        ? getDisplayValue(currentValue)
        : currentValue;
    let validationResponse = validateField(value, validations[fieldName]);
    const customValidator = fetchByPath(onValidate, fieldName);
    if (customValidator) {
      validationResponse = await customValidator(value, validationResponse);
    }
    setErrors((errors) => ({ ...errors, [fieldName]: validationResponse }));
    return validationResponse;
  };
  const convertToLocal = (date) => {
    const df = new Intl.DateTimeFormat("default", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      calendar: "iso8601",
      numberingSystem: "latn",
      hourCycle: "h23",
    });
    const parts = df.formatToParts(date).reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  };
  return (
    <Grid
      as="form"
      rowGap="15px"
      columnGap="15px"
      padding="20px"
      onSubmit={async (event) => {
        event.preventDefault();
        let modelFields = {
          userId,
          title,
          description,
          remindAt,
          stepFnExecutionArn,
        };
        const validationResponses = await Promise.all(
          Object.keys(validations).reduce((promises, fieldName) => {
            if (Array.isArray(modelFields[fieldName])) {
              promises.push(
                ...modelFields[fieldName].map((item) =>
                  runValidationTasks(fieldName, item)
                )
              );
              return promises;
            }
            promises.push(
              runValidationTasks(fieldName, modelFields[fieldName])
            );
            return promises;
          }, [])
        );
        if (validationResponses.some((r) => r.hasError)) {
          return;
        }
        if (onSubmit) {
          modelFields = onSubmit(modelFields);
        }
        try {
          Object.entries(modelFields).forEach(([key, value]) => {
            if (typeof value === "string" && value === "") {
              modelFields[key] = null;
            }
          });
          await DataStore.save(
            Reminder.copyOf(reminderRecord, (updated) => {
              Object.assign(updated, modelFields);
            })
          );
          if (onSuccess) {
            onSuccess(modelFields);
          }
        } catch (err) {
          if (onError) {
            onError(modelFields, err.message);
          }
        }
      }}
      {...getOverrideProps(overrides, "ReminderUpdateForm")}
      {...rest}
    >
      <TextField
        label="User id"
        isRequired={true}
        isReadOnly={false}
        value={userId}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              userId: value,
              title,
              description,
              remindAt,
              stepFnExecutionArn,
            };
            const result = onChange(modelFields);
            value = result?.userId ?? value;
          }
          if (errors.userId?.hasError) {
            runValidationTasks("userId", value);
          }
          setUserId(value);
        }}
        onBlur={() => runValidationTasks("userId", userId)}
        errorMessage={errors.userId?.errorMessage}
        hasError={errors.userId?.hasError}
        {...getOverrideProps(overrides, "userId")}
      ></TextField>
      <TextField
        label="Title"
        isRequired={true}
        isReadOnly={false}
        value={title}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              userId,
              title: value,
              description,
              remindAt,
              stepFnExecutionArn,
            };
            const result = onChange(modelFields);
            value = result?.title ?? value;
          }
          if (errors.title?.hasError) {
            runValidationTasks("title", value);
          }
          setTitle(value);
        }}
        onBlur={() => runValidationTasks("title", title)}
        errorMessage={errors.title?.errorMessage}
        hasError={errors.title?.hasError}
        {...getOverrideProps(overrides, "title")}
      ></TextField>
      <TextField
        label="Description"
        isRequired={true}
        isReadOnly={false}
        value={description}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              userId,
              title,
              description: value,
              remindAt,
              stepFnExecutionArn,
            };
            const result = onChange(modelFields);
            value = result?.description ?? value;
          }
          if (errors.description?.hasError) {
            runValidationTasks("description", value);
          }
          setDescription(value);
        }}
        onBlur={() => runValidationTasks("description", description)}
        errorMessage={errors.description?.errorMessage}
        hasError={errors.description?.hasError}
        {...getOverrideProps(overrides, "description")}
      ></TextField>
      <TextField
        label="Remind at"
        isRequired={true}
        isReadOnly={false}
        type="datetime-local"
        value={remindAt && convertToLocal(new Date(remindAt))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              userId,
              title,
              description,
              remindAt: value,
              stepFnExecutionArn,
            };
            const result = onChange(modelFields);
            value = result?.remindAt ?? value;
          }
          if (errors.remindAt?.hasError) {
            runValidationTasks("remindAt", value);
          }
          setRemindAt(value);
        }}
        onBlur={() => runValidationTasks("remindAt", remindAt)}
        errorMessage={errors.remindAt?.errorMessage}
        hasError={errors.remindAt?.hasError}
        {...getOverrideProps(overrides, "remindAt")}
      ></TextField>
      <TextField
        label="Step fn execution arn"
        isRequired={false}
        isReadOnly={false}
        value={stepFnExecutionArn}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              userId,
              title,
              description,
              remindAt,
              stepFnExecutionArn: value,
            };
            const result = onChange(modelFields);
            value = result?.stepFnExecutionArn ?? value;
          }
          if (errors.stepFnExecutionArn?.hasError) {
            runValidationTasks("stepFnExecutionArn", value);
          }
          setStepFnExecutionArn(value);
        }}
        onBlur={() =>
          runValidationTasks("stepFnExecutionArn", stepFnExecutionArn)
        }
        errorMessage={errors.stepFnExecutionArn?.errorMessage}
        hasError={errors.stepFnExecutionArn?.hasError}
        {...getOverrideProps(overrides, "stepFnExecutionArn")}
      ></TextField>
      <Flex
        justifyContent="space-between"
        {...getOverrideProps(overrides, "CTAFlex")}
      >
        <Button
          children="Reset"
          type="reset"
          onClick={(event) => {
            event.preventDefault();
            resetStateValues();
          }}
          isDisabled={!(idProp || reminderModelProp)}
          {...getOverrideProps(overrides, "ResetButton")}
        ></Button>
        <Flex
          gap="15px"
          {...getOverrideProps(overrides, "RightAlignCTASubFlex")}
        >
          <Button
            children="Submit"
            type="submit"
            variation="primary"
            isDisabled={
              !(idProp || reminderModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
