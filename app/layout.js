import "./globals.css";
import AppFrame from "./components/AppFrame";

export const metadata = {
  title: "Mason — Daily Hub",
  description: "Local daily operating system synced with the second brain vault.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
