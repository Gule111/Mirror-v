FROM nginx:alpine

# Copy static files to nginx html directory
COPY index.html /usr/share/nginx/html/

# Expose port 3000 to match the proxy_pass configuration and docker-compose
EXPOSE 3000

# Overwrite default nginx config to listen on port 3000
RUN sed -i 's/listen       80;/listen       3000;/g' /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
