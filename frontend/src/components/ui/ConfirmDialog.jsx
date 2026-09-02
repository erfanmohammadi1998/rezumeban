/* eslint-disable react-refresh/only-export-components */
import { useState, useCallback, createContext, useContext } from "react";
import Modal from "./Modal";
import { Button } from "./primitives";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
    const [state, setState] = useState(null);

    const confirm = useCallback(
        (opts) =>
            new Promise((resolve) => {
                setState({ ...opts, resolve });
            }),
        []
    );

    const close = (result) => {
        state?.resolve(result);
        setState(null);
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <Modal
                open={Boolean(state)}
                onClose={() => close(false)}
                title={state?.title || "تأیید عملیات"}
                size="sm"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => close(false)}>
                            {state?.cancelText || "انصراف"}
                        </Button>
                        <Button
                            variant={state?.danger ? "danger" : "primary"}
                            onClick={() => close(true)}
                        >
                            {state?.confirmText || "تأیید"}
                        </Button>
                    </>
                }
            >
                <p className="text-slate-300 leading-relaxed">
                    {state?.message}
                </p>
            </Modal>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
    return ctx;
}
