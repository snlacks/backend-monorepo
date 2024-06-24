import { roles } from "./roles";
import { RolesService } from "./roles.service";

describe("RolesService", () => {
  it("should pupulate the roles in the database", async () => {
    const roleRepository = {
      upsert: jest.fn(),
    };
    const service = new RolesService(roleRepository as any);

    await service.seedRoles();
    expect(roleRepository.upsert).toHaveBeenCalledWith(
      roles[0],
      RolesService.UPSERT_CONFIG,
    );
    expect(roleRepository.upsert).toHaveBeenCalledWith(
      roles[1],
      RolesService.UPSERT_CONFIG,
    );
  });
});
