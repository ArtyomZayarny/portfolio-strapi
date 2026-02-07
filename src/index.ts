import type { Core } from '@strapi/strapi';
import path from 'path';
import fs from 'fs';

const projectsData = [
  {
    title: "AI Resume builder",
    image: "ai-resume-builder.png",
    description: "An AI-powered resume builder application",
    tag: "Web",
    gitUrl: "https://github.com/ArtyomZayarny/ai-builder-app",
    previewUrl: "https://ai-builder-app-kappa.vercel.app/",
  },
  {
    title: "Dental care",
    image: "dental-care.png",
    description: "A dental care management system",
    tag: "Web",
    gitUrl: "https://github.com/ArtyomZayarny/dentalscaner",
    previewUrl: "https://dentalscaner-fe.vercel.app/",
  },
  {
    title: "Neuro focus",
    image: "neuro-focus.png",
    description: "A neuroscience-focused productivity app",
    tag: "Web",
    gitUrl: "https://github.com/ArtyomZayarny/neuro-focus",
    previewUrl: "https://neuro-focus-murex.vercel.app/",
  },
  {
    title: "Tickets booking system",
    image: "tickets-booking.png",
    description: "A ticket booking and reservation system",
    tag: "Web",
    gitUrl: "https://github.com/ArtyomZayarny/booking-ticks/",
    previewUrl: "https://booking-ticks-fe.vercel.app/",
  },
  {
    title: "Trello clone",
    image: "trello-clone.png",
    description: "A Trello-like project management tool",
    tag: "Web",
    gitUrl: "https://github.com/ArtyomZayarny/TaskManager",
    previewUrl: "https://trello-clone-tau-sage.vercel.app/",
  },
  {
    title: "Bike booking admin panel",
    image: "bike-admin.png",
    description: "An admin panel for bike booking management",
    tag: "Web",
    gitUrl: "https://github.com/ArtyomZayarny/bike-booking",
    previewUrl: "/images/projects/bike-admin.png",
  },
  {
    title: "Article management system",
    image: "article-manager.png",
    description: "A content management system for articles",
    tag: "Web",
    gitUrl: "https://github.com/ArtyomZayarny/article-manager",
    previewUrl: "/images/projects/article-manager.png",
  },
  {
    title: "Landing page",
    image: "landing-page.png",
    description: "A minimalist landing page",
    tag: "Web",
    gitUrl: "https://github.com/ArtyomZayarny/lp-mnmlst",
    previewUrl: "https://lp-mnmlst.vercel.app/",
  },
];

async function uploadProjectImages(strapi: Core.Strapi) {
  try {
    console.log('Uploading project images...');

    const clientImagesPath = path.join(__dirname, '../../client/public/images/projects');
    const uploadedImages: { [key: string]: any } = {};

    for (const projectData of projectsData) {
      const imagePath = path.join(clientImagesPath, projectData.image);

      if (!fs.existsSync(imagePath)) {
        console.warn(`Image not found: ${imagePath}`);
        continue;
      }

      try {
        // Read the file
        const fileBuffer = fs.readFileSync(imagePath);
        const fileName = projectData.image;

        // Create readable stream for upload
        const { Readable } = await import('stream');
        const stream = Readable.from([fileBuffer]);

        // Upload using strapi's upload service
        const uploadedFiles = await (strapi.service('plugin::upload.upload') as any).upload({
          files: {
            stream,
            filename: fileName,
            mimetype: 'image/png',
            size: fileBuffer.length,
          },
        });

        if (uploadedFiles && uploadedFiles.length > 0) {
          uploadedImages[projectData.image] = uploadedFiles[0].id;
          console.log(`Uploaded image: ${fileName}`);
        }
      } catch (err) {
        console.error(`Failed to upload ${projectData.image}:`, err);
      }
    }

    return uploadedImages;
  } catch (error) {
    console.error('Error uploading images:', error);
    return {};
  }
}

async function seedProjects(strapi: Core.Strapi) {
  try {
    // Check if properly seeded projects exist (via Document Service)
    const existing = await strapi.documents('api::project.project').findMany();

    // Also check for orphaned rows created via db.query (not visible in admin)
    const dbRows = await strapi.db.query('api::project.project').findMany();

    if (existing.length > 0 && existing.length === dbRows.length) {
      console.log(`Projects already seeded (${existing.length} documents), skipping...`);
      return;
    }

    // Clean up orphaned rows that were created via db.query instead of Document Service
    if (dbRows.length > 0 && dbRows.length !== existing.length) {
      console.log(`Found ${dbRows.length} DB rows but only ${existing.length} documents. Cleaning up...`);
      for (const row of dbRows) {
        await strapi.db.query('api::project.project').delete({ where: { id: row.id } });
      }
      console.log('Cleaned up orphaned rows.');
    }

    console.log('Seeding projects...');

    // Upload images first
    const uploadedImages = await uploadProjectImages(strapi);

    for (const projectData of projectsData) {
      try {
        const imageId = uploadedImages[projectData.image] || null;

        const project = await strapi.documents('api::project.project').create({
          data: {
            title: projectData.title,
            description: projectData.description,
            tag: projectData.tag,
            gitUrl: projectData.gitUrl,
            previewUrl: projectData.previewUrl,
            ...(imageId ? { image: imageId } : {}),
          } as any,
          status: 'published',
        });

        console.log(`Created project: ${project.title}${imageId ? ' with image' : ' (no image)'}`);
      } catch (err) {
        console.error(`Failed to create project "${projectData.title}":`, err);
      }
    }

    console.log('Project seeding completed!');
  } catch (error) {
    console.error('Error seeding projects:', error);
  }
}

async function setProjectPermissions(strapi: Core.Strapi) {
  try {
    console.log('Setting up project permissions...');

    const roleService = strapi.service('plugin::users-permissions.role') as {
      findOne: (id: number) => Promise<{ id: number; permissions: Record<string, unknown> }>;
      updateRole: (id: number, data: { permissions: Record<string, unknown> }) => Promise<void>;
    };

    const roles = await strapi.db.query('plugin::users-permissions.role').findMany();
    const publicRole = roles.find((r: { type: string }) => r.type === 'public');

    if (!publicRole) {
      console.log('Public role not found');
      return;
    }

    const roleWithPermissions = await roleService.findOne(publicRole.id);
    const permissions = roleWithPermissions.permissions as Record<
      string,
      { controllers: Record<string, Record<string, { enabled: boolean }>> }
    >;

    if (permissions['api::project.project']) {
      permissions['api::project.project'].controllers.project.find.enabled = true;
      permissions['api::project.project'].controllers.project.findOne.enabled = true;
      await roleService.updateRole(publicRole.id, { permissions });
      console.log('Project permissions (find, findOne) configured successfully');
    } else {
      console.log('Set manually: Admin → Settings → Users & Permissions → Public → Project → find, findOne');
    }
  } catch (error) {
    console.error('Error setting permissions:', error);
    console.log('Permissions must be set manually: Admin → Settings → Users & Permissions → Public → Project → find, findOne');
  }
}

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await seedProjects(strapi);
    await setProjectPermissions(strapi);
  },
};
