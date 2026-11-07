import { getPublicWorkflowState } from "@/lib/publicSubmissionAvailability";
import { ProfileEnquiryForm, type RequestConnectionButtonProps } from "./ProfileEnquiryForm";

export function RequestConnectionButton(props: RequestConnectionButtonProps) {
  const supported = props.requestSource === "farmer_profile" || props.requestSource === "supplier_profile" || props.requestSource === "generic_sourcing";
  return <ProfileEnquiryForm {...props} publicSubmissionAvailable={supported && getPublicWorkflowState("lead-requests").available} />;
}
