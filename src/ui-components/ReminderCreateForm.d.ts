/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
export declare type EscapeHatchProps = {
    [elementHierarchy: string]: Record<string, unknown>;
} | null;
export declare type VariantValues = {
    [key: string]: string;
};
export declare type Variant = {
    variantValues: VariantValues;
    overrides: EscapeHatchProps;
};
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type ReminderCreateFormInputValues = {
    userId?: string;
    title?: string;
    description?: string;
    remindAt?: string;
};
export declare type ReminderCreateFormValidationValues = {
    userId?: ValidationFunction<string>;
    title?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
    remindAt?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type ReminderCreateFormOverridesProps = {
    ReminderCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    userId?: PrimitiveOverrideProps<TextFieldProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextFieldProps>;
    remindAt?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type ReminderCreateFormProps = React.PropsWithChildren<{
    overrides?: ReminderCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: ReminderCreateFormInputValues) => ReminderCreateFormInputValues;
    onSuccess?: (fields: ReminderCreateFormInputValues) => void;
    onError?: (fields: ReminderCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: ReminderCreateFormInputValues) => ReminderCreateFormInputValues;
    onValidate?: ReminderCreateFormValidationValues;
} & React.CSSProperties>;
export default function ReminderCreateForm(props: ReminderCreateFormProps): React.ReactElement;
