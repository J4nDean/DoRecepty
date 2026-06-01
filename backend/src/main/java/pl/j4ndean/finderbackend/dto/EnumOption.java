package pl.j4ndean.finderbackend.dto;

/**
 * Opcja wyboru dla list rozwijanych / filtrów w UI.
 * code     – stabilny kod używany w bazie/API
 * label    – wyświetlana etykieta po polsku
 * category – opcjonalna grupa (np. ACTIVE/ARCHIVED dla statusów recept)
 */
public record EnumOption(String code, String label, String category) {
    public static EnumOption of(String code, String label) {
        return new EnumOption(code, label, null);
    }
    public static EnumOption of(String code, String label, String category) {
        return new EnumOption(code, label, category);
    }
}
