/** Site-wide settings. Copy and contact details live here, not in components. */
export const site = {
  name: "Alert Global Tech",
  portalName: "AI Demos",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://demos.alertglobal.tech",
  mainSite: "https://alertglobal.tech",
  salesEmail: "sales@alertglobaltech.com",
  demoMailto:
    "mailto:sales@alertglobaltech.com?subject=" + encodeURIComponent("Book a Demo: AI tools"),
  footerStatement: "Hardware, software and AI, sorted.",
  description:
    "Working demos of AI tools that take repetitive work off your team. Fictional companies, sample data, no signup needed.",
} as const;

export const howWeWork = [
  {
    num: "01",
    title: "Find the hours",
    text: "We sit with your team and list the repetitive work that eats the week.",
  },
  {
    num: "02",
    title: "Build the tool",
    text: "We build it inside the systems you already use, with checks before anything is sent or posted.",
  },
  {
    num: "03",
    title: "Prove the time saved",
    text: "We measure the task before and after, so the result is a number you can check.",
  },
  {
    num: "04",
    title: "Keep it running",
    text: "We stay accountable after launch: monitoring, fixes and changes as your work changes.",
  },
] as const;
