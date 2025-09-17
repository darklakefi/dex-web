"use client";

import { useCallback, useState } from "react";

export interface TransactionState {
	step: number;
	isLoading: boolean;
	isDisabled: boolean;
}

export interface UseTransactionStateReturn {
	step: number;
	isLoading: boolean;
	isDisabled: boolean;
	setStep: (step: number) => void;
	setLoading: (loading: boolean) => void;
	setDisabled: (disabled: boolean) => void;
	reset: () => void;
	incrementStep: () => void;
}

export const useTransactionState = (
	initialStep = 0,
	initialLoading = false,
	initialDisabled = false,
): UseTransactionStateReturn => {
	const [step, setStep] = useState(initialStep);
	const [isLoading, setIsLoading] = useState(initialLoading);
	const [isDisabled, setIsDisabled] = useState(initialDisabled);

	const setLoading = useCallback((loading: boolean) => {
		setIsLoading(loading);
	}, []);

	const setDisabled = useCallback((disabled: boolean) => {
		setIsDisabled(disabled);
	}, []);

	const reset = useCallback(() => {
		setStep(initialStep);
		setIsLoading(initialLoading);
		setIsDisabled(initialDisabled);
	}, [initialStep, initialLoading, initialDisabled]);

	const incrementStep = useCallback(() => {
		setStep((prev) => prev + 1);
	}, []);

	return {
		step,
		isLoading,
		isDisabled,
		setStep,
		setLoading,
		setDisabled,
		reset,
		incrementStep,
	};
};
