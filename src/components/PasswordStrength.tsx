interface PasswordStrengthProps {
  password: string;
}

const getStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
};

const getLabel = (score: number) => {
  if (score <= 2) return { text: "Weak", color: "bg-destructive" };
  if (score <= 4) return { text: "Medium", color: "bg-yellow-500" };
  return { text: "Strong", color: "bg-green-500" };
};

const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  if (!password) return null;

  const score = getStrength(password);
  const { text, color } = getLabel(score);
  const percentage = Math.min((score / 6) * 100, 100);

  return (
    <div className="mt-2 space-y-1">
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength: <span className="font-medium">{text}</span>
      </p>
    </div>
  );
};

export default PasswordStrength;
