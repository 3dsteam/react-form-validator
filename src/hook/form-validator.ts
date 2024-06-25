import { IRule, IRuleMessage } from "../models/rule";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import moment from "moment";

interface IKeyRule extends IRule {
    key: string;
}

interface IFormValidatorProps {
    /**
     * Data to validate
     */
    data?: Record<string, unknown>;
    rules: Record<string, true | IRule>;
    // Options
    options?: {
        emailRegex?: RegExp;
        urlRegex?: RegExp;
        dateFormat?: string;
        translation?: {
            prefix?: string | null;
        };
    };
}

// Regex
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const urlRegex = /^(http|https):\/\/[^ "]+$/;

export const useFormValidator = (props?: IFormValidatorProps) => {
    const { t } = useTranslation();

    // Options
    const options = useRef(props?.options ?? {});

    const rules = useRef<IKeyRule[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    /**
     * Update rules
     * @param options {Record<string, true | IRule>}
     */
    const updateRules = (options: Record<string, true | IRule>) => {
        const _rules: IKeyRule[] = [];
        for (const key in options) {
            // Check if key is fast required (boolean) (e.g. {key: true})
            if (typeof options[key] === "boolean") _rules.push({ key, required: true });
            else _rules.push({ key, ...(options[key] as IRule) });
        }
        // Update rules
        rules.current = _rules;
    };

    /**
     * Rules listener
     * Update rules state when rules are changed
     */
    useEffect(() => updateRules(props?.rules ?? {}), [props?.rules]);

    // Flag to check if validate function is called at least once
    // This is used for live validation after first submit
    const flagValidated = useRef(false);
    const dataRef = useRef<Record<string, unknown>>(props?.data ?? {});

    const getTranslation = useCallback(
        (key: string, values?: Record<string, unknown>): string => {
            const prefix = options.current.translation?.prefix;
            if (prefix === null) return t(key, values);
            else if (prefix === undefined) return t(`Validation.${key}`, values);
            return t(`${prefix}.${key}`, values);
        },
        [t],
    );

    const isRuleMessage = (options: unknown): options is IRuleMessage<unknown> => {
        return !!options && typeof options === "object" && "value" in options && "message" in options;
    };

    /**
     * Validate data
     * @param data {Record<string, unknown>}
     * @param live {boolean | undefined}
     */
    const validate = useCallback(
        (data: Record<string, unknown>, live = true) => {
            if (live) flagValidated.current = true;
            const errors: Record<string, string> = {};
            // Check if empty rules
            if (rules.current.length === 0) {
                console.warn("[Form Validator] No rules defined");
                // Clear errors
                setErrors(errors);
                return true;
            }
            // Each rules
            for (const rule of rules.current) {
                const key = rule.key;
                // Get value from data
                const value = data[key];
                // Validate required
                if (rule.required && !value) {
                    errors[key] = isRuleMessage(rule.required)
                        ? rule.required.message
                        : getTranslation("This field is required");
                }
                // Validate on value
                else if (value !== undefined && value !== null) {
                    // Check if email
                    if (rule.isEmail) {
                        const regex = options.current.emailRegex ?? emailRegex;
                        if (!regex.test(value as string)) {
                            errors[key] = isRuleMessage(rule.isEmail)
                                ? rule.isEmail.message
                                : getTranslation("Invalid email address");
                        }
                    }
                    // Check if URL
                    if (rule.isURL) {
                        const regex = options.current.urlRegex ?? urlRegex;
                        if (!regex.test(value as string)) {
                            errors[key] = isRuleMessage(rule.isURL)
                                ? rule.isURL.message
                                : getTranslation("Invalid URL");
                        }
                    }
                    // Check if string is too short
                    if (rule.minLength !== undefined) {
                        const minLength = typeof rule.minLength === "number" ? rule.minLength : rule.minLength.value;
                        if ((value as string).length < minLength) {
                            errors[key] = isRuleMessage(rule.minLength)
                                ? rule.minLength.message
                                : getTranslation("Minimum length is {{value}}", { value: minLength });
                        }
                    }
                    // Check if string is too long
                    if (rule.maxLength !== undefined) {
                        const maxLength = typeof rule.maxLength === "number" ? rule.maxLength : rule.maxLength.value;
                        if ((value as string).length > maxLength) {
                            errors[key] = isRuleMessage(rule.maxLength)
                                ? rule.maxLength.message
                                : getTranslation("Maximum length is {{value}}", { value: maxLength });
                        }
                    }
                    // Check if pattern is matched
                    if (rule.pattern) {
                        const regex = isRuleMessage(rule.pattern) ? rule.pattern.value : rule.pattern;
                        if (!regex.test(value as string)) {
                            errors[key] = isRuleMessage(rule.pattern)
                                ? rule.pattern.message
                                : getTranslation("Invalid value");
                        }
                    }
                    // Check if number is too small
                    if (rule.min !== undefined) {
                        const minValue = typeof rule.min === "number" ? rule.min : rule.min.value;
                        if ((value as number) < minValue) {
                            errors[key] = isRuleMessage(rule.min)
                                ? rule.min.message
                                : getTranslation("Minimum value is {{value}}", { value: minValue });
                        }
                    }
                    // Check if number is too big
                    if (rule.max !== undefined) {
                        const maxValue = typeof rule.max === "number" ? rule.max : rule.max.value;
                        if ((value as number) > maxValue) {
                            errors[key] = isRuleMessage(rule.max)
                                ? rule.max.message
                                : getTranslation("Maximum value is {{value}}", { value: maxValue });
                        }
                    }
                    // Check if date is before
                    if (rule.ltDate) {
                        const date = moment(isRuleMessage(rule.ltDate) ? rule.ltDate.value : rule.ltDate).format(
                            options.current.dateFormat,
                        );
                        if (!moment(value as string).isBefore(date)) {
                            errors[key] = isRuleMessage(rule.ltDate)
                                ? rule.ltDate.message
                                : getTranslation("Date must be before {{value}}", { value: date });
                        }
                    }
                    // Check if date is on or before
                    if (rule.lteDate) {
                        const date = moment(isRuleMessage(rule.lteDate) ? rule.lteDate.value : rule.lteDate).format(
                            options.current.dateFormat,
                        );
                        if (!moment(value as string).isSameOrBefore(date)) {
                            errors[key] = isRuleMessage(rule.lteDate)
                                ? rule.lteDate.message
                                : getTranslation("Date must be on or before {{value}}", { value: date });
                        }
                    }
                    // Check if date is after
                    if (rule.gtDate) {
                        const date = moment(isRuleMessage(rule.gtDate) ? rule.gtDate.value : rule.gtDate).format(
                            options.current.dateFormat,
                        );
                        if (!moment(value as string).isAfter(date)) {
                            errors[key] = isRuleMessage(rule.gtDate)
                                ? rule.gtDate.message
                                : getTranslation("Date must be after {{value}}", { value: date });
                        }
                    }
                    // Check if date is on or after
                    if (rule.gteDate) {
                        const date = moment(isRuleMessage(rule.gteDate) ? rule.gteDate.value : rule.gteDate).format(
                            options.current.dateFormat,
                        );
                        if (!moment(value as string).isSameOrAfter(date)) {
                            errors[key] = isRuleMessage(rule.gteDate)
                                ? rule.gteDate.message
                                : getTranslation("Date must be on or after {{value}}", { value: date });
                        }
                    }
                }
                // Check if custom validation
                if (rule.custom) {
                    // Check if custom validation failed
                    const valid = rule.custom(data, key);
                    if (!valid || typeof valid === "string") {
                        errors[key] = valid || getTranslation("Invalid value");
                    }
                }
                // Check if blockly validation
                if (rule.blockly) {
                    try {
                        const valid = new Function("data", rule.blockly)(data);
                        if (!valid || typeof valid === "string") {
                            if (valid === undefined) {
                                console.warn(`Blockly validation for ${key} is not returning any value`);
                            }
                            errors[key] = valid || getTranslation("Invalid value");
                        }
                    } catch (e) {
                        console.warn(e);
                        errors[key] = getTranslation("Validation error (blockly)");
                    }
                }
            }
            // Set errors
            setErrors(errors);
            return Object.keys(errors).length === 0;
        },
        [getTranslation],
    );

    // Check if form is valid
    const isValid = useMemo(() => flagValidated.current && Object.keys(errors).length === 0, [errors]);

    // Live validation
    useEffect(() => {
        if (!flagValidated.current || !props?.data) return;
        // Check if data is changed
        if (JSON.stringify(dataRef.current) === JSON.stringify(props.data)) return;
        // Validate current data
        dataRef.current = props.data;
        validate(props.data);
    }, [props?.data, validate]);

    return { updateRules, validate, isValid, errors };
};
