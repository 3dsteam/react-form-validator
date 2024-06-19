export interface IRule {
    required?: true | IRuleMessage<true>;
    // Type
    isEmail?: true | IRuleMessage<true>;
    isURL?: true | IRuleMessage<true>;
    // String
    minLength?: number | IRuleMessage<number>;
    maxLength?: number | IRuleMessage<number>;
    pattern?: RegExp | IRuleMessage<RegExp>;
    // Number
    min?: number | IRuleMessage<number>;
    max?: number | IRuleMessage<number>;
    // Date
    ltDate?: string | Date | IRuleMessage<string | Date>;
    lteDate?: string | Date | IRuleMessage<string | Date>;
    gtDate?: string | Date | IRuleMessage<string | Date>;
    gteDate?: string | Date | IRuleMessage<string | Date>;
}

export interface IRuleMessage<T> {
    value: T;
    message: string;
}
