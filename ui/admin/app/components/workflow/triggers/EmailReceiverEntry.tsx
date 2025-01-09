import { EmailReceiver } from "~/lib/model/email-receivers";

import { CopyText } from "~/components/composed/CopyText";
import { DeleteWorkflowTrigger } from "~/components/workflow-triggers/DeleteWorkflowTrigger";
import { WorkflowEmailDialog } from "~/components/workflow/triggers/WorkflowEmailDialog";

export function EmailTriggerEntry({
    receiver,
    workflowId,
}: {
    receiver: EmailReceiver;
    workflowId: string;
}) {
    return (
        <div key={receiver.id} className="flex justify-between items-center">
            <p>{receiver.name || receiver.id}</p>

            <div className="flex gap-2">
                <CopyText
                    text={receiver.emailAddress}
                    className="bg-transparent text-muted-foreground text-sm"
                    classNames={{
                        text: "p-0",
                    }}
                    hideIcon
                />

                <WorkflowEmailDialog
                    workflowId={workflowId}
                    emailReceiver={receiver}
                />

                <DeleteWorkflowTrigger type="email" id={receiver.id} />
            </div>
        </div>
    );
}
