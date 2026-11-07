# HOF Store — Home of Fabric

Responsive black-and-white HOF storefront and Supabase-backed admin dashboard.

## Upload to GitHub
Upload all files in this folder to the root of the `main` branch of your `HOF-Store` repository.

## Publish with GitHub Pages
In the repository, open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/(root)`, then Save. GitHub will show the published URL when deployment completes.

## Supabase configuration
The browser uses the project's public publishable key in `config.js`. Never add a Supabase secret or service-role key to browser files.

The expected `products` table contains: `id`, `name`, `price`, `category`, `unit`, `description`, `images` (text array), `is_available`, `is_new_arrival`, `created_at`, `updated_at`.

The image bucket is `product-images`. Uploads are stored under the administrator UID folder.

## Before launch
Verify RLS is enabled; public SELECT is restricted to available products; administrator SELECT/INSERT/UPDATE/DELETE policies are restricted to the intended UID; and Storage INSERT/UPDATE/DELETE policies require both that UID and the matching first folder. Confirm public Storage SELECT is scoped to `product-images`.

Test the storefront signed out and test all admin functions using the authorised account. Keep your Supabase password private.

## Known behaviour
When editing, newly selected photos are appended to existing photos. Product deletion does not delete Storage objects, to avoid accidentally deleting images still used by another product.
