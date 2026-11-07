SELECT count(*) AS restantes FROM public.clientes
WHERE regexp_replace(telefono, '\D', '', 'g') LIKE '1100000%';