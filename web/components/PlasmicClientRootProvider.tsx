"use client";

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
    return (
        <PlasmicRootProvider loader={PLASMIC_CLIENT} prefetchedData={props.prefetchedData}>
            {props.children}
        </PlasmicRootProvider>
    );
}
