import { useTheme } from "../theme/ThemeProvider";

export function EmptyState({ message = "Keine Daten" }: { message?: string }) {
  const { tokens } = useTheme();
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: tokens.text.muted,
        fontSize: 13,
      }}
    >
      {message}
    </div>
  );
}