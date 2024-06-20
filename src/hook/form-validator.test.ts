import { it, expect, describe, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useFormValidator } from "./form-validator";

it("initializes form validator with empty errors", () => {
    const { result } = renderHook(() => useFormValidator());
    expect(result.current.errors).toEqual({});
});

it("validates multiple fields", () => {
    const { result } = renderHook(() =>
        useFormValidator({
            rules: {
                firstname: true,
                lastname: true,
            },
        }),
    );
    // Validate
    act(() => result.current.validate({ firstname: null, lastname: null }));
    expect(result.current.errors).toEqual({
        firstname: expect.any(String),
        lastname: expect.any(String),
    });
});

it("validates multiple rules", () => {
    const { result } = renderHook(() =>
        useFormValidator({
            rules: {
                firstname: {
                    required: true,
                    minLength: 3,
                },
            },
        }),
    );
    // Validate
    act(() => result.current.validate({ firstname: null }));
    expect(result.current.errors).toEqual({ firstname: expect.any(String) });
    // Validate with minLength invalid
    act(() => result.current.validate({ firstname: "ab" }));
    expect(result.current.errors).toEqual({ firstname: expect.any(String) });
});

describe("Custom validation", () => {
    let result;

    beforeEach(() => {
        result = renderHook(() =>
            useFormValidator({
                rules: {
                    firstname: {
                        custom: (data) => data.firstname === "John",
                    },
                },
            }),
        ).result;
    });

    it("validates with invalid value", () => {
        act(() => result.current.validate({ firstname: "Jane" }));
        expect(result.current.errors).toEqual({ firstname: expect.any(String) });
    });

    it("validates with valid value", () => {
        act(() => result.current.validate({ firstname: "John" }));
        expect(result.current.errors).toEqual({});
    });

    describe("When data is invalid with custom message", () => {
        beforeEach(() => {
            result = renderHook(() =>
                useFormValidator({
                    rules: {
                        firstname: {
                            custom: (data) => {
                                if (data.firstname === "John") return true;
                                return "Invalid name";
                            },
                        },
                    },
                }),
            ).result;
        });

        it("validates field with custom message", () => {
            act(() => result.current.validate({ firstname: "Jane" }));
            expect(result.current.errors).toEqual({ firstname: "Invalid name" });
        });
    });
});

describe("Blockly validation", () => {
    let result;

    beforeEach(() => {
        result = renderHook(() =>
            useFormValidator({
                rules: {
                    firstname: {
                        blockly: `return data.firstname === "John" ? true : "The name is not John"`,
                    },
                },
            }),
        ).result;
    });

    it("validates with invalid value", () => {
        act(() => result.current.validate({ firstname: "Jane" }));
        expect(result.current.errors).toEqual({ firstname: "The name is not John" });
    });

    it("validates with valid value", () => {
        act(() => result.current.validate({ firstname: "John" }));
        expect(result.current.errors).toEqual({});
    });
});
