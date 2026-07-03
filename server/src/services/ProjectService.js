import ProjectRepository from "../repositories/ProjectRepository.js";
import AuditLogService from "./AuditLogService.js";

class ProjectService {
    async getAllProjects(query = {}) {
        return ProjectRepository.findAll(query);
    }

    async getProjectById(id) {
        const project = await ProjectRepository.findById(id);
        if (!project) {
            throw new Error("Project not found");
        }
        return project;
    }

    async createProject(projectData, adminId, ipAddress = "") {
        const project = await ProjectRepository.create(projectData);
        await AuditLogService.logAction(
            adminId,
            "PROJECT_CREATE",
            { projectId: project._id, title: project.title, amount: project.totalAmount },
            ipAddress
        );
        return project;
    }

    async updateProject(id, updateData, adminId, ipAddress = "") {
        const original = await ProjectRepository.findById(id);
        if (!original) {
            throw new Error("Project not found");
        }

        const project = await ProjectRepository.update(id, updateData);
        
        const changes = {};
        for (const key of Object.keys(updateData)) {
            if (original[key] !== updateData[key]) {
                changes[key] = { before: original[key], after: updateData[key] };
            }
        }

        await AuditLogService.logAction(
            adminId,
            "PROJECT_UPDATE",
            { projectId: id, changes },
            ipAddress
        );

        return project;
    }

    async deleteProject(id, adminId, ipAddress = "") {
        const project = await ProjectRepository.delete(id);
        if (!project) {
            throw new Error("Project not found");
        }

        await AuditLogService.logAction(
            adminId,
            "PROJECT_DELETE",
            { projectId: id, title: project.title },
            ipAddress
        );
        return project;
    }
}

export default new ProjectService();
