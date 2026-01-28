import type { Core } from '@strapi/strapi';
import path from 'path';
import fs from 'fs';

const projectsData = [
  {
    title: "AI Resume builder",
    image: "ai-resume-builder.png",
    description: "An AI-powered resume builder application",
    tag: ["Web"],
    gitUrl: "https://github.com/ArtyomZayarny/ai-builder-app",
    previewUrl: "https://ai-builder-app-kappa.vercel.app/",
  },
  {
    title: "Dental care",
    image: "dental-care.png",
    description: "A dental care management system",
    tag: ["Web"],
    gitUrl: "https://github.com/ArtyomZayarny/dentalscaner",
    previewUrl: "https://dentalscaner-fe.vercel.app/",
  },
  {
    title: "Neuro focus",
    image: "neuro-focus.png",
    description: "A neuroscience-focused productivity app",
    tag: ["Web"],
    gitUrl: "https://github.com/ArtyomZayarny/neuro-focus",
    previewUrl: "https://neuro-focus-murex.vercel.app/",
  },
  {
    title: "Tickets booking system",
    image: "tickets-booking.png",
    description: "A ticket booking and reservation system",
    tag: ["Web"],
    gitUrl: "https://github.com/ArtyomZayarny/booking-ticks/",
    previewUrl: "https://booking-ticks-fe.vercel.app/",
  },
  {
    title: "Trello clone",
    image: "trello-clone.png",
    description: "A Trello-like project management tool",
    tag: ["Web"],
    gitUrl: "https://github.com/ArtyomZayarny/TaskManager",
    previewUrl: "https://trello-clone-tau-sage.vercel.app/",
  },
  {
    title: "Bike booking admin panel",
    image: "bike-admin.png",
    description: "An admin panel for bike booking management",
    tag: ["Web"],
    gitUrl: "https://github.com/ArtyomZayarny/bike-booking",
    previewUrl: "/images/projects/bike-admin.png",
  },
  {
    title: "Article management system",
    image: "article-manager.png",
    description: "A content management system for articles",
    tag: ["Web"],
    gitUrl: "https://github.com/ArtyomZayarny/article-manager",
    previewUrl: "/images/projects/article-manager.png",
  },
  {
    title: "Landing page",
    image: "landing-page.png",
    description: "A minimalist landing page",
    tag: ["Web"],
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
    // Check if projects already exist
    const existingProjects = await strapi.db.query('api::project.project').findMany();
    if (existingProjects && existingProjects.length > 0) {
      console.log('Projects already seeded, skipping...');
      return;
    }

    console.log('Seeding projects...');

    // Upload images first
    const uploadedImages = await uploadProjectImages(strapi);

    for (const projectData of projectsData) {
      const imageId = uploadedImages[projectData.image] || null;

      // Create project entry with image
      const project = await strapi.db.query('api::project.project').create({
        data: {
          title: projectData.title,
          description: projectData.description,
          tag: projectData.tag,
          gitUrl: projectData.gitUrl,
          previewUrl: projectData.previewUrl,
          image: imageId,
          publishedAt: new Date(),
        },
      });

      console.log(`Created project: ${project.title}${imageId ? ' with image' : ' (no image)'}`);
    }

    console.log('Project seeding completed!');
  } catch (error) {
    console.error('Error seeding projects:', error);
  }
}

async function setProjectPermissions(strapi: Core.Strapi) {
  try {
    console.log('Setting up project permissions...');

    // Get the public role
    const publicRole = await strapi
      .db.query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (!publicRole) {
      console.log('Public role not found');
      return;
    }

    console.log('Setting permissions for public role');

    // Use the plugin service to update permissions
    const usersPermissionsService = strapi.service('plugin::users-permissions.permissions');

    if (usersPermissionsService && usersPermissionsService.updateRole) {
      // Try updating role with new permissions
      const permissions = {
        'api::project.project': {
          controllers: {
            project: {
              find: [{ enabled: true }],
              findOne: [{ enabled: true }],
            },
          },
        },
      };

      await usersPermissionsService.updateRole(publicRole.id, {
        permissions,
      });

      console.log('Project permissions configured successfully');
    } else {
      console.log('Users-permissions service not available, permissions must be set manually');
    }
  } catch (error) {
    console.error('Error setting permissions:', error);
    console.log('Permissions must be set manually through the admin panel');
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
  bootstrap({ strapi }: { strapi: Core.Strapi }) {
    seedProjects(strapi);
    setProjectPermissions(strapi);
  },
};
