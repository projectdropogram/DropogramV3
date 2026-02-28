"use client";

import { useState, useEffect } from "react";
import { PlasmicRootProvider, PlasmicComponent } from "@plasmicapp/loader-nextjs";
import { PLASMIC_CLIENT } from "../plasmic-init-client";
import { ProducerForm } from "./ProducerForm";

// Register components here
PLASMIC_CLIENT.registerComponent(ProducerForm, {
    name: "ProducerForm",
    props: {
        className: "string",
    },
});

export function PlasmicClientRootProvider(props: { children: React.ReactNode; prefetchedData?: any }) {
    // Defer Plasmic to client-only to avoid hydration mismatch:
    // PlasmicRootProvider injects a <style> tag that is empty on the server
    // but populated with CSS (fonts, etc.) on the client.
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    if (!mounted) {
        return <>{props.children}</>;
    }

    return (
        <PlasmicRootProvider loader={PLASMIC_CLIENT} prefetchedData={props.prefetchedData}>
            {props.children}
        </PlasmicRootProvider>
    );
}
