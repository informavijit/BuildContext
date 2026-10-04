import { FileEntry } from '../util/fs';
import { readAndSanitizeText } from '../languages/encoding';

export function extractBuildRunTestScripts(appFiles: FileEntry[]): Record<string, string> {
  const result: Record<string, string> = {};

  const pkgJson = appFiles.find((f) => f.relativePath.endsWith('package.json'));
  if (pkgJson) {
    try {
      const content = JSON.parse(readAndSanitizeText(pkgJson.absolutePath));
      if (content.scripts) {
        if (content.scripts.build) result['Build'] = `npm run build`;
        if (content.scripts.start || content.scripts.dev) result['Run'] = content.scripts.start ? `npm start` : `npm run dev`;
        if (content.scripts.test) result['Test'] = `npm test`;
        if (content.scripts.lint) result['Lint'] = `npm run lint`;
      }
    } catch {}
  }

  const pubspec = appFiles.find((f) => f.relativePath.endsWith('pubspec.yaml'));
  if (pubspec) {
    result['Build'] = `flutter build`;
    result['Run'] = `flutter run`;
    result['Test'] = `flutter test`;
  }

  const pomXml = appFiles.find((f) => f.relativePath.endsWith('pom.xml'));
  if (pomXml) {
    result['Build'] = `mvn clean package`;
    result['Run'] = `mvn spring-boot:run`;
    result['Test'] = `mvn test`;
  }

  const csproj = appFiles.find((f) => f.relativePath.endsWith('.csproj'));
  if (csproj) {
    result['Build'] = `dotnet build`;
    result['Run'] = `dotnet run`;
    result['Test'] = `dotnet test`;
  }

  const pyProject = appFiles.find((f) => f.relativePath.endsWith('pyproject.toml') || f.relativePath.endsWith('requirements.txt'));
  if (pyProject) {
    result['Run'] = `python -m main`;
    result['Test'] = `pytest`;
  }

  if (Object.keys(result).length === 0) {
    result['Run'] = `Execute main application entry point`;
  }

  return result;
}
